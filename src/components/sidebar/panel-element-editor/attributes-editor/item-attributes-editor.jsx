import React, {Component} from 'react';
import PropTypes from 'prop-types';
import FormNumberInput from '../../../style/form-number-input';

let tableStyle = {
  width: '100%'
};
let firstTdStyle = {
  width: '6em'
};
let inputStyle = {
  textAlign: 'left'
}

export default function ItemAttributesEditor({element, onUpdate, attributeFormData, state}, {translator}) {
  let renderedX = attributeFormData.has('x') ? attributeFormData.get('x') : element.x;
  let renderedY = attributeFormData.has('y') ? attributeFormData.get('y') : element.y;
  let renderedR = attributeFormData.has('rotation') ? attributeFormData.get('rotation') : element.rotation;

  return <table style={tableStyle}>
    <tbody>
    <tr>
      <td style={firstTdStyle}>X:</td>
      <td><FormNumberInput value={renderedX} onChange={event => onUpdate('x', event.target.value)} style={inputStyle}
                           state={state}/>
      </td>
    </tr>
    <tr>
      <td style={firstTdStyle}>Y:</td>
      <td><FormNumberInput value={renderedY} onChange={event => onUpdate('y', event.target.value)} style={inputStyle}
                           state={state}/>
      </td>
    </tr>
    <tr>
      <td style={firstTdStyle}>{translator.t("Rotation")}:</td>
      <td><FormNumberInput value={renderedR} onChange={event => onUpdate('rotation', event.target.value)}
                           style={inputStyle} state={state}/></td>
    </tr>
    </tbody>
  </table>;
}

ItemAttributesEditor.propTypes = {
  element: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  attributeFormData: PropTypes.object.isRequired,
  state: PropTypes.object.isRequired
};

ItemAttributesEditor.contextTypes = {
  translator: PropTypes.object.isRequired,
};
