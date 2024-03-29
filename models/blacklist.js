'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Blacklist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Blacklist.init({
    char: DataTypes.STRING,
    user: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Blacklist',
  });
  return Blacklist;
};