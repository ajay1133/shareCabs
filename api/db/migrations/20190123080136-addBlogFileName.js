'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .addColumn('blogs', 'fileName', {
        type: Sequelize.STRING
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('blogs', 'fileName');
  }
};