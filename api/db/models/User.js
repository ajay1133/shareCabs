const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'users',
    {
      id                    : { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      firstName             : { type: Sequelize.STRING, allowNull: true },
      lastName              : { type: Sequelize.STRING, allowNull: true },
      email                 : { type: Sequelize.STRING, allowNull: true },
      hash                  : { type: Sequelize.TEXT },
      salt                  : { type: Sequelize.TEXT },
      role                  : { type: Sequelize.INTEGER },
      createdAt             : { type: Sequelize.DATE },
      updatedAt             : { type: Sequelize.DATE },
      isDeleted             : { type: Sequelize.BOOLEAN, defaultValue: 0 }
    },
    {
      defaultScope: {
        where: {
          isDeleted: 0
        }
      }
    },
    {
      tableName: 'users'
    }
  );

  User.getUserById = query => new Promise((resolve, reject) => {
      User
      .findOne(query)
      .then(resolve)
      .catch(reject);
  });

  return User;
};
