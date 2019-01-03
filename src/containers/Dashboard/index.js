import React, { Component } from 'react';
import MarkDown from 'markdown-it';
import Markup from 'react-html-markup';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { reduxForm, SubmissionError } from 'redux-form/immutable';
import PropTypes from 'prop-types';
import { Button, Table, Loader, Modal, Icon, Message, Grid } from 'semantic-ui-react';
import AddFile from '../../components/File/AddFile';
import EditFile from '../../components/File/EditFile';
import Pagination from '../../components/Pagination';
import {
	bitBucketListing,
	bitBucketView,
	updateBitBucketFile,
	resetBitBucketFileForm
} from '../../redux/modules/bitBucketRepo';
import {
	strictValidObjectWithKeys,
	validFileName,
	validObjectWithParameterKeys,
	strictValidArrayWithLength
} from '../../utils/commonutils';
import {
	DEFAULT_ACCESSIBLE_ROOT_PATH,
	REPO_PATH,
	MD_FILE_META_DATA_KEYS,
	KEYS_TO_IGNORE_IN_EXTRA_META_FIELDS,
	VALID_ACCESSIBLE_FILE_FORMATS,
	DEFAULT_BITBUCKET_LIST_FILTERS,
	OFFSET
} from '../../utils/constants';
import moment from 'moment';

const md = MarkDown({
  html: false,
  linkify: true,
  typographer: true
});

@connect(state => ({
	initialValues: state.get('bitBucketRepo').get('bitBucketInitialValues'),
	user: state.get('auth').get('user'),
  message: state.get('bitBucketRepo').get('message'),
  isLoad: state.get('bitBucketRepo').get('isLoad'),
  loadErr: state.get('bitBucketRepo').get('loadErr'),
	bitBucketList: state.get('bitBucketRepo').get('bitBucketList'),
	bitBucketListFilters: state.get('bitBucketRepo').get('bitBucketListFilters')
}))
@reduxForm({
  form: 'setFileForm',
  enableReinitialize: true
})
export default class Dashboard extends Component {
  state = {
    loading: true,
    modalOpenFlag: false,
    openRepoFile: false,
    fileName: null,
    fileContent: null,
    href: null,
    repoPath: null,
    showMessageFlag: true
  };
  
  static propTypes = {
    dispatch: PropTypes.func,
    handleSubmit: PropTypes.func,
    user: PropTypes.oneOfType([
    	PropTypes.string,
	    PropTypes.object
    ]),
    message: PropTypes.string,
    isLoad: PropTypes.bool,
    loadErr: PropTypes.string,
    error: PropTypes.string,
    location: PropTypes.object,
	  bitBucketList: PropTypes.array,
	  bitBucketListFilters: PropTypes.object
  };
	
	constructor(props) {
		super(props);
		this.saveAccount = this.getBitBucketData.bind(this);
	};
	
  componentDidMount = async () => {
    const { dispatch, bitBucketListFilters, bitBucketList } = this.props;
    const params = validObjectWithParameterKeys(bitBucketListFilters, Object.keys(DEFAULT_BITBUCKET_LIST_FILTERS)) ?
	    bitBucketListFilters : (bitBucketListFilters.toJSON() || DEFAULT_BITBUCKET_LIST_FILTERS);
    
    const areFiltersSameFlag = JSON.stringify(params) === JSON.stringify(bitBucketListFilters);
    const needToSyncDataFlag = !strictValidArrayWithLength(bitBucketList) || !areFiltersSameFlag;
    
	  if (needToSyncDataFlag) {
	  	await dispatch(bitBucketListing(params));
	  }
	  
	  this.setState({ loading: false });
  };
	
  getMd = (content) => {
  	try {
		  return md.render(content);
	  } catch (error) {
  		console.log('Error in rendering file: ', error);
  		return null;
	  }
  };
  
  getBitBucketData = async (e, href, type, displayName, repoPath, openFileInEditModeFlag = false) => {
    const { dispatch, bitBucketListFilters } = this.props;
	  
    const params = {
      path: (href && typeof href === 'string' && href.split('/src')[1]) || DEFAULT_ACCESSIBLE_ROOT_PATH
    };
	  
    this.setState({ loading: true });
    
    let res = null;
    const isLoadingDirectoryFlag = type === 'commit_directory';
    
    if (isLoadingDirectoryFlag) {
      res = await dispatch(bitBucketListing(Object.assign({}, bitBucketListFilters, params)));
    } else {
	    res = await dispatch(bitBucketView(params));
    }
	  
    this.setState({
      loading: false,
      modalOpenFlag: !isLoadingDirectoryFlag,
	    openRepoFile: !isLoadingDirectoryFlag && openFileInEditModeFlag,
      fileName: !isLoadingDirectoryFlag ? displayName : null,
      fileContent: !isLoadingDirectoryFlag && res.data ? res.data : null,
      href,
      repoPath
    });
  };
	
	navigateBitBucketListPage = async (page) => {
		const { dispatch, bitBucketListFilters } = this.props;
		this.setState({ loading: true });
		await dispatch(bitBucketListing(Object.assign({}, bitBucketListFilters, { page })));
		this.setState({ loading: false });
	};
	
  setFile = async (values) => {
    const { dispatch, bitBucketListFilters } = this.props;
    const { href, repoPath } = this.state;
    
    const formValues = values.toJSON() || {};
    
    const isAddingFileFlag = validObjectWithParameterKeys(formValues, ['fileName', 'filePath']);
	  
    if (isAddingFileFlag && !validFileName(formValues.fileName, VALID_ACCESSIBLE_FILE_FORMATS)) {
    	throw new SubmissionError({ _error:
		    'Invalid File Name, a valid file must start with \'_\' or alphanumeric character and have a \'.md\' extension'
    	});
    }
	
	  const basePath = repoPath || REPO_PATH;
    
    const dataObject = {
      path: isAddingFileFlag ? basePath + '/' + formValues.fileName : basePath,
      content: this.compileFormFieldsToMarkDown(formValues, isAddingFileFlag),
      type: 2
    };
    
    this.setState({ loading: true });
		
    const params = {
			path: (href && typeof href === 'string' && href.split('/src')[1]) || DEFAULT_ACCESSIBLE_ROOT_PATH
		};
    
    await dispatch(updateBitBucketFile(dataObject));
	  await dispatch(bitBucketListing(Object.assign({}, bitBucketListFilters, params)));
	
	  let res = null;
	
	  if (!isAddingFileFlag) {
		  res = await dispatch(bitBucketView(params));
	  }
	
	  this.setState({
		  loading: false,
		  modalOpenFlag: !isAddingFileFlag,
		  openRepoFile: !isAddingFileFlag,
		  fileName: !isAddingFileFlag ? this.state.fileName : null,
		  fileContent: !isAddingFileFlag && res.data ? res.data : null,
		  href,
		  repoPath
	  });
	  
	  this.setState({ loading: false });
  };
	
	compileFormFieldsToMarkDown = (dataObj, isAddingFileFlag) => {
	  const dataObjKeys = (strictValidObjectWithKeys(dataObj) && Object.keys(dataObj)) || [];
	 
	  const extraMetaDataKeys = dataObjKeys
		  .filter(k => MD_FILE_META_DATA_KEYS.indexOf(k) <= -1 && KEYS_TO_IGNORE_IN_EXTRA_META_FIELDS.indexOf(k) <= -1);
    const validMetaDataKeys = dataObjKeys.filter(k => MD_FILE_META_DATA_KEYS.indexOf(k) > -1);
		
    let mdStr = '---\n';
	
	  validMetaDataKeys
		  .forEach(k => {
        mdStr += `${k}: ${dataObj[k].toString()}\n`;
      });
	  
	  extraMetaDataKeys.forEach(k => {
		  mdStr += `${k}: ${dataObj[k]}\n`;
	  });
	
	  if (isAddingFileFlag) {
		  mdStr += `date: ${moment().format()}\n`;
	  }
	  
	  mdStr += '---\n';
   
	  if (dataObjKeys.indexOf('content') > -1) {
		  mdStr += dataObj.content.trim();
	  }
	  
	  return mdStr;
  };
  
	modalOpen = async (addNewFileFlag) => {
		const { dispatch } = this.props;
		const stateObject = { openRepoFile: true };
		
	  if (addNewFileFlag) {
	    stateObject.modalOpenFlag = true;
		  this.setState({ loading: true });
		  await dispatch(resetBitBucketFileForm());
		  this.setState({ loading: false });
    }
    
	  this.setState(stateObject);
	};
  
  modalClose = () => {
    this.setState({
      modalOpenFlag: false,
      openRepoFile: false,
	    fileName: null,
	    fileContent: null,
	    href: null,
	    repoPath: null
    });
  };
	
  messageDismiss = () => this.setState({ showMessageFlag: false });
  
  render () {
    const {
    	dispatch, isLoad, loadErr, bitBucketList = [], bitBucketListFilters, handleSubmit, user, message, error
    } = this.props;
    const { loading, fileName, fileContent, repoPath, modalOpenFlag, openRepoFile, showMessageFlag } = this.state;
	  
	  const isValidUserFlag = strictValidObjectWithKeys(user) && !!user.id;
    const sessionExpiredFlag = !loading && !isLoad && !isValidUserFlag;
    const loadingCompleteFlag = !isLoad;
    const validBitBucketListFlag = loadingCompleteFlag && Array.isArray(bitBucketList) && bitBucketList.length;
    const isFileLoadedSuccessFlag = !!fileName;
	  
    if (sessionExpiredFlag) {
      dispatch(push('/'));
    }
    
    return (
      <div>
        {
          message && showMessageFlag &&
          <Message onDismiss={this.messageDismiss}>
            <span style={{ color: 'green' }}>{ message }</span>
          </Message>
        }
        
        {
	        loadErr && showMessageFlag && !modalOpenFlag &&
          <Message onDismiss={this.messageDismiss}>
            <span style={{ color: 'red' }}>{ loadErr }</span>
          </Message>
        }
	
	      <div className="ui card fluid cardShadow">
		      <div className="content pageMainTitle">
			      <Grid>
				      <div className="ui left floated column innerAdjust">
					      <h3 className="mainHeading"> Dashboard</h3>
				      </div>
				      <Grid.Row>
					      <Grid.Column>
						      <h4>
							      { loadingCompleteFlag ? 'Listing' : 'Loading' } Files From BitBucket Repository
							      {
								      loadingCompleteFlag &&
								      <Button
									      primary
									      style={{ float: 'right', marginTop: '-10px' }}
									      onClick={ () => this.modalOpen(true) }
								      >
									      Add File
								      </Button>
							      }
						      </h4>
						
						      {
							      validBitBucketListFlag &&
							      <div className="content" style={{ marginTop: '10px', marginRight: '10px' }}>
								      <Table celled>
									      <Table.Header>
										      <Table.Row>
											      <Table.HeaderCell>File Name</Table.HeaderCell>
											      <Table.HeaderCell><span style={{ float: 'right' }}>Action (s)</span></Table.HeaderCell>
										      </Table.Row>
									      </Table.Header>
									      <Table.Body>
										      {
											      bitBucketList.map((repo, idx) => {
											      	const validFileFlag = validFileName(
											      		repo.path.split('/').pop(),
													      VALID_ACCESSIBLE_FILE_FORMATS
												      );
											      	
												      return (
													      <Table.Row key={idx}>
														      <Table.Cell>
															      { repo.path.split('/').pop() }
														      </Table.Cell>
														      <Table.Cell>
															      <Icon
																      name="edit"
																      style={{ float: 'right' }}
																      disabled={ !validFileFlag }
																      onClick={ (e) => validFileFlag && this.getBitBucketData(
																	      e,
																	      repo.links.self.href,
																	      repo.type,
																	      repo.path.split('/').pop(),
																	      repo.path,
																	      true
																      ) }
															      />
															      <Icon
																      name="eye"
																      style={{ float: 'right', marginRight: '10px' }}
																      onClick={ (e) => this.getBitBucketData(
																	      e,
																	      repo.links.self.href,
																	      repo.type,
																	      repo.path.split('/').pop(),
																	      repo.path,
																	      false
																      ) }
															      />
														      </Table.Cell>
													      </Table.Row>
												      );
											      })
										      }
									      </Table.Body>
									      <Table.Footer>
										      <Table.Row>
											      <Table.HeaderCell colSpan='5'>
												      <Pagination
													      totalEntries={
													      	bitBucketList.length === OFFSET ?
															      (bitBucketListFilters.page * OFFSET) + 1
															      : bitBucketListFilters.page * OFFSET
													      }
													      offset={ OFFSET }
													      currentPage={ bitBucketListFilters.page }
													      navigate={(page) => this.navigateBitBucketListPage(page)}
												      />
											      </Table.HeaderCell>
										      </Table.Row>
									      </Table.Footer>
								      </Table>
							      </div>
						      }
						
						      {
							      loadingCompleteFlag && !validBitBucketListFlag &&
							      <div className="content">
								      <span style={{ color: 'red' }}>{ loadErr || 'Error loading repository' }</span>
							      </div>
						      }
						
						      {
							      !loadingCompleteFlag &&
							      <div className="content">
								      <Loader active inline='centered'>Loading ...</Loader>
							      </div>
						      }
					      </Grid.Column>
				      </Grid.Row>
			      </Grid>
		      </div>
	      </div>
	      
        {
          !loading && loadingCompleteFlag &&
          <Modal
            open={ modalOpenFlag }
            dimmer="blurring"
            closeOnEscape={ true }
            closeOnDimmerClick={ false }
            onClose={this.modalClose}
            size="large"
            closeIcon
          >
            <Modal.Header>
              { fileName && <Icon name='file' size='large' /> }
              <span style={{ marginLeft: '5px' }}>{ fileName || 'Add File' }</span>
            </Modal.Header>
            <Modal.Content>
	            {
		            loadErr && showMessageFlag &&
		            <Message onDismiss={this.messageDismiss}>
			            <span style={{ color: 'red' }}>{ loadErr }</span>
		            </Message>
	            }
	            {
		            error &&
		            <Message onDismiss={this.messageDismiss}>
			            <span style={{ color: 'red' }}>{ error }</span>
		            </Message>
	            }
              <Modal.Description>
                {
                  !openRepoFile && isFileLoadedSuccessFlag &&
                  <Markup htmlString= { this.getMd(fileContent) } />
                }
                {
                  !openRepoFile && !isFileLoadedSuccessFlag &&
                  <span style={{ color: 'red' }}>Error fetching content</span>
                }
                {
                  openRepoFile && isFileLoadedSuccessFlag &&
                  <EditFile />
                }
                {
	                openRepoFile && !isFileLoadedSuccessFlag &&
                  <AddFile repoPath={repoPath} />
                }
              </Modal.Description>
            </Modal.Content>
            <Modal.Actions>
              {
                openRepoFile &&
                <Button positive onClick={handleSubmit(this.setFile)}>
                  <i aria-hidden='true' className='save icon' />Save
                </Button>
              }
              {
                !openRepoFile &&
                <Button primary onClick={ () => this.modalOpen(false) }>
                  <i aria-hidden='true' className='edit icon' />Edit
                </Button>
              }
              <Button
                primary
                content="Cancel"
                onClick={this.modalClose}
              />
            </Modal.Actions>
          </Modal>
        }
      </div>
    );
  }
}

