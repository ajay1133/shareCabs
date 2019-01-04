'use strict';
module.exports = (sequelize, DataTypes) => {
  const searchKeyword = sequelize.define('searchKeyword', {
    keyword: DataTypes.STRING,
    status: DataTypes.TINYINT
  }, {});
  searchKeyword.associate = function(models) {
    // associations can be defined here
  };
  return searchKeyword;
};