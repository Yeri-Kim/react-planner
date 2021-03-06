var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

import React from 'react';
import PropTypes from 'prop-types';
import Panel from './panel';
import IconVisible from 'react-icons/lib/fa/eye';
import IconAdd from 'react-icons/lib/ti/plus';
import IconEdit from 'react-icons/lib/fa/pencil';
import IconTrash from 'react-icons/lib/fa/trash';

import { MODE_IDLE, MODE_2D_ZOOM_IN, MODE_2D_ZOOM_OUT, MODE_2D_PAN, MODE_3D_VIEW, MODE_3D_FIRST_PERSON, MODE_WAITING_DRAWING_LINE, MODE_DRAWING_LINE, MODE_DRAWING_HOLE, MODE_DRAWING_ITEM, MODE_DRAGGING_LINE, MODE_DRAGGING_VERTEX, MODE_DRAGGING_ITEM, MODE_DRAGGING_HOLE, MODE_FITTING_IMAGE, MODE_UPLOADING_IMAGE, MODE_ROTATING_ITEM, MODE_CONFIGURING_LAYER } from '../../constants';

var STYLE_ADD_WRAPPER = {
  color: "#fff",
  textDecoration: "none",
  fontSize: "15px",
  padding: "0px 15px"
};

var STYLE_ADD_LABEL = {
  fontSize: "10px",
  marginLeft: "5px"
};

var STYLE_EDIT_BUTTON = {
  cursor: "pointer",
  marginLeft: "5px",
  border: "0px",
  background: "none",
  color: "#fff",
  fontSize: "14px",
  outline: "0px"
};

var iconColStyle = { width: '2em' };
var tableStyle = {
  width: '100%',
  cursor: 'pointer',
  overflowY: 'auto',
  maxHeight: '20em',
  display: 'block',
  padding: '0 1em',
  marginLeft: '1px'
};

export default function PanelLayers(_ref, _ref2) {
  var _ref$state = _ref.state,
      scene = _ref$state.scene,
      mode = _ref$state.mode;
  var sceneActions = _ref2.sceneActions,
      translator = _ref2.translator;


  if (![MODE_IDLE, MODE_2D_ZOOM_IN, MODE_2D_ZOOM_OUT, MODE_2D_PAN, MODE_3D_VIEW, MODE_3D_FIRST_PERSON, MODE_WAITING_DRAWING_LINE, MODE_DRAWING_LINE, MODE_DRAWING_HOLE, MODE_DRAWING_ITEM, MODE_DRAGGING_LINE, MODE_DRAGGING_VERTEX, MODE_DRAGGING_ITEM, MODE_DRAGGING_HOLE, MODE_ROTATING_ITEM, MODE_UPLOADING_IMAGE, MODE_FITTING_IMAGE, MODE_CONFIGURING_LAYER].includes(mode)) return null;

  var addClick = function addClick(event) {
    sceneActions.addLayer();
    event.stopPropagation();
  };

  var isLastLayer = scene.layers.size === 1;

  return React.createElement(
    Panel,
    { name: translator.t("Layers") },
    React.createElement(
      'table',
      { style: tableStyle },
      React.createElement(
        'thead',
        null,
        React.createElement(
          'tr',
          null,
          React.createElement('th', { colSpan: '3' }),
          React.createElement(
            'th',
            null,
            translator.t("Altitude")
          ),
          React.createElement(
            'th',
            null,
            translator.t("Name")
          )
        )
      ),
      React.createElement(
        'tbody',
        null,
        scene.layers.entrySeq().map(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 2),
              layerID = _ref4[0],
              layer = _ref4[1];

          var selectClick = function selectClick(e) {
            return sceneActions.selectLayer(layerID);
          };
          var configureClick = function configureClick(e) {
            return sceneActions.openLayerConfigurator(layer.id);
          };
          var delLayer = function delLayer(e) {
            e.stopPropagation();
            sceneActions.removeLayer(layerID);
          };

          var swapVisibility = function swapVisibility(e) {
            sceneActions.setLayerProperties(layerID, { visible: !layer.visible });
            e.stopPropagation();
          };

          var isCurrentLayer = layerID === scene.selectedLayer;
          var eyeStyle = !layer.visible ? { fontSize: '1.25em', color: "#a5a1a1" } : { fontSize: '1.25em' };

          return React.createElement(
            'tr',
            { key: layerID, onClick: selectClick, onDoubleClick: configureClick },
            React.createElement(
              'td',
              { style: iconColStyle },
              !isCurrentLayer ? React.createElement(IconVisible, { onClick: swapVisibility, style: eyeStyle }) : null
            ),
            React.createElement(
              'td',
              { style: iconColStyle },
              React.createElement(IconEdit, { onClick: configureClick, style: STYLE_EDIT_BUTTON, title: translator.t("Configure layer") })
            ),
            React.createElement(
              'td',
              { style: iconColStyle },
              !isLastLayer ? React.createElement(IconTrash, { onClick: delLayer, style: STYLE_EDIT_BUTTON,
                title: translator.t("Delete layer") }) : null
            ),
            React.createElement(
              'td',
              { style: { width: '6em', textAlign: 'center' } },
              '[ h : ',
              layer.altitude,
              ' ]'
            ),
            React.createElement(
              'td',
              null,
              layer.name
            )
          );
        })
      )
    ),
    React.createElement(
      'div',
      { style: STYLE_ADD_WRAPPER, onClick: addClick },
      React.createElement(IconAdd, null),
      React.createElement(
        'span',
        { style: STYLE_ADD_LABEL },
        translator.t("New layer")
      )
    )
  );
}

PanelLayers.propTypes = {
  state: PropTypes.object.isRequired
};

PanelLayers.contextTypes = {
  sceneActions: PropTypes.object.isRequired,
  translator: PropTypes.object.isRequired
};