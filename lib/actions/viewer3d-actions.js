'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectTool3DView = selectTool3DView;
exports.selectTool3DFirstPerson = selectTool3DFirstPerson;
exports.selectTool3DPresent = selectTool3DPresent;

var _constants = require('../constants');

function selectTool3DView() {
  return {
    type: _constants.SELECT_TOOL_3D_VIEW
  };
}

function selectTool3DFirstPerson() {
  return {
    type: _constants.SELECT_TOOL_3D_FIRST_PERSON
  };
}

function selectTool3DPresent() {
  return {
    type: _constants.SELECT_TOOL_3D_PRESENT
  };
}