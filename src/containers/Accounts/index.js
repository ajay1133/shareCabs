import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table, Modal, Grid, Button, Header, Message, Confirm, Icon, Segment, Image, Form, FormField, Dropdown, List } from  'semantic-ui-react';
import { loadAccounts, saveAccount, updateAccount, sortAccounts, selectUser,  } from '../../redux/modules/account';
import AccountModal  from '../../components/AccountModal';
import { Field, reduxForm } from 'redux-form/immutable';
import { TextBox } from '../../components/Form';
import { required, email } from '../../utils/validations';
import Pagination from '../../components/Pagination';
import { OFFSET } from '../../utils/constants';
import AuthenticatedUser from '../../components/AuthenticatedUser';
import { strictValidObjectWithKeys } from '../../utils/commonutils';
import '../../style/css/style.css';

const rowBgColor = [];
rowBgColor[1] = 'bg-success';
rowBgColor[3] = 'bg-danger';

const options = [
    { key: 1, text: 'Choice 1', value: 1 },
    { key: 2, text: 'Choice 2', value: 2 },
    { key: 3, text: 'Choice 3', value: 3 },
]
const TableRow = ({row, editAccount, typeAction}) => (
  <Table.Row className={(row.status) ? rowBgColor[row.status] : 'bg-warning'}>
    <Table.Cell>{ row.firstName } { row.lastName }</Table.Cell>
    <Table.Cell>{ row.email } </Table.Cell>
    <Table.Cell>{ row.phone }</Table.Cell>
    <Table.Cell>
      <a onClick={ () => editAccount(row) } >  <Icon name='edit outline' size='small' /> </a>
      <a onClick={() => typeAction('delete', row)} > <Icon name='trash alternate outline' size='small' /> </a>
      <a onClick={() => typeAction('active', row)} > <Icon name='check circle outline' size='small' /></a>
      <a onClick={() => typeAction('denied', row)} > <Icon name='eye slash outline' size='small' /> </a>
    </Table.Cell>
  </Table.Row>
);

@connect(state => ({
  items: state.get('account').get('items'),
  loadErr: state.get('account').get('loadErr'),
  itemsCount: state.get('account').get('itemsCount'),
  accountErr: state.get('account').get('accountErr'),
  message: state.get('bitBucketRepo').get('message') || state.get('account').get('accountMsg'),
  isLoad: state.get('bitBucketRepo').get('isLoad')
}))
@reduxForm({
    form: 'listForm',
    // enableReinitialize: true
})
export default class Accounts extends Component {
  static propTypes = {
    dispatch: PropTypes.func,
    message: PropTypes.string,
    isLoad: PropTypes.bool,
  };

  static defaultProps = {
    dispatch: null
  };
  
  state = {
    modalOpen: false,
    currentPage: 1,
    sortDir: 'asc',
    sortCol: 'firstName',
    selectedUser: null,
    openConfirmBox: false,
    type: null,
    showMessageFlag: true
  };
  
  constructor(props) {
    super(props);
    
    this.account = this.account.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.editAccount = this.editAccount.bind(this);
    this.typeAction = this.typeAction.bind(this);
    this.closeConfirmBox = this.closeConfirmBox.bind(this);
  };

  handleOpen = () => {
    const { dispatch } = this.props;
    dispatch(selectUser(undefined));
    this.setState({ modalOpen: true })
  };

  handleClose = () => this.setState({ modalOpen: false, selectedUser: null });

  closeConfirmBox = () => this.setState({ openConfirmBox: false, selectedUser: null });

  handleConfirm = () => {
    const { selectedUser, type } = this.state;
    const { dispatch } = this.props;
    
    let accountDetail = {
      id: selectedUser.id,
      firstName: selectedUser.firstName,
      lastName: selectedUser.lastName
    };
    
    if (type === 'delete') {
      accountDetail.isDeleted = true;
    } else if (type === 'active'){
      accountDetail.status = 1;
    } else if (type === 'denied') {
      accountDetail.status = 3;
    }
    
    dispatch(updateAccount(accountDetail, false)).then(response => {
      this.setState({openConfirmBox: false, selectedUser: null});
    });
  };

  editAccount = row => {
    const { dispatch } = this.props;
    dispatch(selectUser(row));
    this.setState({ modalOpen: true, selectedUser: row })
  };
  
  typeAction = (type, row) => {
    this.setState({ openConfirmBox: true, type, selectedUser: row })
  };
  
  account = details => {
    const { dispatch } = this.props;
    delete details.events;
    Object.keys(details).forEach((key) => (!details[key]) && delete details[key]);
    return new Promise( async (resolve, reject) => {
      const response = (details.id)
        ? await dispatch(updateAccount(details, true))
        : await dispatch(saveAccount(details));
      this.setState({modalOpen: false, selectedUser: null});
      if (response && response.id) {
        resolve(response);
      } else {
        reject(response);
      }
    });
  };
  
  componentDidMount() {
    const { dispatch, user } = this.props;
	  
    if (strictValidObjectWithKeys(user) && user.role !== 1) {
		  dispatch.push('/dashboard');
	  }
	
	  dispatch(loadAccounts());
  };
  
  handleSort = clickedColumn => {
    const { dispatch } = this.props;
    const { sortDir } = this.state;

    dispatch(sortAccounts(sortDir === 'asc' ? 'desc' : 'asc',clickedColumn));
    this.setState({ sortDir : sortDir === 'asc' ? 'desc' : 'asc', sortCol : clickedColumn });
  };
  
  messageDismiss = () => this.setState({ showMessageFlag: false });
  
  render() {
    const { items, loadErr, accountErr, itemsCount, message } = this.props;
    const { sortCol, sortDir, selectedUser, showMessageFlag } = this.state;
    const sortDirClass = sortDir === 'asc' ? 'active sortAsc' : 'active sortDesc';
    
    let users = [];
    
    if (items && items.length > 0) {
        let begin = (this.state.currentPage - 1) * OFFSET;
        let end = OFFSET * this.state.currentPage;
        users = items.slice(begin, end)
    }
    
    if (loadErr) {
      return (
        <Message negative> <Message.Header> {loadErr} </Message.Header> </Message>
      );
    } else if (items) {
      return (
        <AuthenticatedUser>
          {
            message && showMessageFlag &&
            <Message onDismiss={this.messageDismiss}>
              <span style={{ color: 'green' }}>{ message }</span>
            </Message>
          }
          {
            (loadErr || accountErr) && showMessageFlag &&
            <Message onDismiss={this.messageDismiss}>
              <span style={{ color: 'red' }}>{ loadErr || accountErr }</span>
            </Message>
          }
          <Grid>
            <div className="ui left floated column innerAdjust">
              <h3 className="mainHeading"> Accounts</h3>
            </div>
            <Grid.Row>
              <Grid.Column  computer={12}>
                <Confirm
                  content={`Are you sure you want to ${this.state.type} this user ?`}
                  confirmButton="Confirm"
                  open={this.state.openConfirmBox}
                  onCancel={this.closeConfirmBox}
                  onConfirm={this.handleConfirm}
                />
                <Modal className="innerModal" trigger={<Button icon='add' onClick={this.handleOpen} />}
                      open={this.state.modalOpen}
                      onClose={this.handleClose}
                      closeIcon>
                  <Header content= {selectedUser ? 'Edit Account' : 'Add New Account'} />
                  <Modal.Content>
                    <AccountModal
                      account = {this.account}
                      selectedUser = {selectedUser}
                    />
                  </Modal.Content>
                </Modal>

                <div className="indicator">
                  <List horizontal>
                    <List.Item>
                      <span className="statusPending"/>
                      <List.Content>
                       Pending
                      </List.Content>
                    </List.Item>
                    <List.Item>
                      <span className="statusDenied"/>
                      <List.Content>
                        Denied
                      </List.Content>
                    </List.Item>
                    <List.Item>
                      <span className="statusActive"/>
                      <List.Content>
                        Active
                      </List.Content>
                    </List.Item>

                    <List.Item>
                      <span className=""/>
                      <List.Content>
                       |    Sort All
                      </List.Content>
                    </List.Item>

                    <List.Item>
                      <List.Content>
                        <Dropdown clearable options={options} selection />
                      </List.Content>
                    </List.Item>
                  </List>



                </div>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column  computer={12}>
                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell
                        className={`${sortCol === 'firstName' ? sortDirClass : 'sortAsc'}` }>
                        <a onClick={() => this.handleSort('firstName') }>Name<i className="sort amount down icon ml-05"></i></a>
                      </Table.HeaderCell>
                      <Table.HeaderCell
                        className={`${sortCol === 'email' ? sortDirClass : 'sortAsc'}` }>
                        <a onClick={() => this.handleSort('email') }>Email<i className="sort amount down icon ml-05"></i></a>
                      </Table.HeaderCell>
                      <Table.HeaderCell
                        className={`${sortCol==='phone' ? sortDirClass : 'sortAsc'}` }>
                        <a onClick={() => this.handleSort('phone') }>Phone<i className="sort amount down icon ml-05"></i></a>
                      </Table.HeaderCell>
                    <Table.HeaderCell>Action</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    { users.length > 0 &&
                      users.map(row => {
                        return <TableRow
                          key={row.id}
                          row={row}
                          editAccount={this.editAccount}
                          typeAction={this.typeAction}
                        />
                      })
                    }
                  </Table.Body>
                </Table>
                <Pagination
                    totalEntries={itemsCount}
                    offset={OFFSET}
                    currentPage={this.state.currentPage}
                    navigate={(page) => this.setState({ currentPage: page })}
                />
              </Grid.Column>

              <Grid.Column  computer={4}>
                <div>
                  <Header as='h4' attached='top' className="Primary">
                   Add New Profile
                  </Header>
                  <Segment attached>
                    <Image src='https://react.semantic-ui.com/images/wireframe/square-image.png' size='tiny' circular />
                    <Form className="mt-10">
                      <Form.Field>
                        <input placeholder='First Name' />
                      </Form.Field>
                      <Form.Field>
                        <input placeholder='Last Name' />
                      </Form.Field>
                      <Form.Field>
                        <input placeholder='Email' />
                      </Form.Field>
                      <Form.Field>
                        <input placeholder='Phone Number' />
                      </Form.Field>
                      <Button className="primary" type='submit'>Add Profile</Button>
                    </Form>
                  </Segment>
                </div>
              </Grid.Column>

            </Grid.Row>
          </Grid>
        </AuthenticatedUser>
      );
    } else {
      return;
    }
  }
}
