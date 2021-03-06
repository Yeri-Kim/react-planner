import React from 'react';
import PropTypes from 'prop-types';
import FormLabel from '../../components/style/form-label';

var tableStyle = { width: "100%", borderSpacing: "2px 0", marginBottom: "2px" };
var firstTdStyle = { width: '6em' };

export default function PropertyCheckbox(_ref) {
  var value = _ref.value,
      onUpdate = _ref.onUpdate,
      configs = _ref.configs,
      sourceElement = _ref.sourceElement,
      internalState = _ref.internalState;


  var update = function update(val) {

    if (configs.hook) {
      return configs.hook(val).then(function (_val) {
        return onUpdate(_val);
      });
    }

    return onUpdate(val);
  };

  return React.createElement(
    'table',
    { className: 'PropertyCheckbox', style: tableStyle },
    React.createElement(
      'tbody',
      null,
      React.createElement(
        'tr',
        null,
        React.createElement(
          'td',
          { style: firstTdStyle },
          React.createElement(
            FormLabel,
            null,
            configs.label
          )
        ),
        React.createElement(
          'td',
          null,
          React.createElement('input', { type: 'checkbox', checked: value, onChange: function onChange(e) {
              return update(!value);
            } })
        )
      )
    )
  );
}

PropertyCheckbox.propTypes = {
  value: PropTypes.any.isRequired,
  onUpdate: PropTypes.func.isRequired,
  configs: PropTypes.object.isRequired,
  sourceElement: PropTypes.object,
  internalState: PropTypes.object
};