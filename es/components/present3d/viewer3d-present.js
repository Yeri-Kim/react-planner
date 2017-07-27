"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import React from 'react';
import ReactDOM from 'react-dom';
import * as Three from 'three';
import { parseData, updateScene } from './scene-creator';
import { disposeScene } from './three-memory-cleaner';
import OrbitControls from './libs/orbit-controls';
import diff from 'immutablediff';

var Present3DViewer = function (_React$Component) {
  _inherits(Present3DViewer, _React$Component);

  function Present3DViewer(props) {
    _classCallCheck(this, Present3DViewer);

    var _this = _possibleConstructorReturn(this, (Present3DViewer.__proto__ || Object.getPrototypeOf(Present3DViewer)).call(this, props));

    _this.lastMousePosition = {};
    _this.width = props.width;
    _this.height = props.height;
    _this.stopRendering = false;

    _this.renderer = window.__threeRenderer || new Three.WebGLRenderer({ preserveDrawingBuffer: true });
    window.__threeRenderer = _this.renderer;
    return _this;
  }

  _createClass(Present3DViewer, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      var actions = {
        // areaActions: this.context.areaActions,
        // holesActions: this.context.holesActions,
        itemsActions: this.context.itemsActions,
        // linesActions: this.context.linesActions,
        projectActions: this.context.projectActions
      };

      var state = this.props.state;

      var data = state.scene;
      var canvasWrapper = ReactDOM.findDOMNode(this.refs.canvasWrapper);

      var scene3D = new Three.Scene();

      //RENDERER
      this.renderer.setClearColor(new Three.Color(0xffffff));
      this.renderer.setSize(this.width, this.height);

      // LOAD DATA
      var planData = parseData(data, actions, this.context.catalog);

      scene3D.add(planData.plan);
      scene3D.add(planData.grid);

      var aspectRatio = this.width / this.height;
      var camera = new Three.PerspectiveCamera(40, aspectRatio, 1, 300000);

      scene3D.add(camera);

      // Set position for the camera
      var cameraPositionX = planData.boundingBox.max.x - planData.boundingBox.min.x;
      var cameraPositionY = planData.boundingBox.max.y - planData.boundingBox.min.y;
      var cameraPositionZ = planData.boundingBox.max.z - planData.boundingBox.min.z;

      camera.position.set(0, 4000, 3000);
      camera.lookAt(0, 0, 0);
      // camera.up = new Three.Vector3(0, 1, 0);

      // HELPER AXIS
      // let axisHelper = new Three.AxisHelper(100);
      // scene3D.add(axisHelper);

      // LIGHT
      var light = new Three.AmbientLight(0xafafaf); // soft white light
      scene3D.add(light);

      // Add another light

      var spotLight1 = new Three.SpotLight(0xffffff, 0.30);
      spotLight1.position.set(cameraPositionX, cameraPositionY, cameraPositionZ);
      scene3D.add(spotLight1);

      // OBJECT PICKING
      var toIntersect = [planData.plan];
      var mouse = new Three.Vector2();
      var raycaster = new Three.Raycaster();

      this.mouseDownEvent = function (event) {
        _this2.lastMousePosition.x = event.offsetX / _this2.width * 2 - 1;
        _this2.lastMousePosition.y = -event.offsetY / _this2.height * 2 + 1;
      };

      this.mouseUpEvent = function (event) {
        event.preventDefault();

        mouse.x = event.offsetX / _this2.width * 2 - 1;
        mouse.y = -(event.offsetY / _this2.height) * 2 + 1;

        if (Math.abs(mouse.x - _this2.lastMousePosition.x) <= 0.02 && Math.abs(mouse.y - _this2.lastMousePosition.y) <= 0.02) {

          raycaster.setFromCamera(mouse, camera);
          var intersects = raycaster.intersectObjects(toIntersect, true);

          if (intersects.length > 0) {

            var type = intersects[0].object.type;
            if (type === 'wall' || type === 'window' || type === 'area') return;

            intersects[0].object.interact && intersects[0].object.interact();
          } else {
            _this2.context.projectActions.unselectAll();
          }
        }
      };

      this.renderer.domElement.addEventListener('mousedown', this.mouseDownEvent);
      this.renderer.domElement.addEventListener('mouseup', this.mouseUpEvent);

      // add the output of the renderer to the html element
      canvasWrapper.appendChild(this.renderer.domElement);

      // create orbit controls
      var orbitController = new OrbitControls(camera, this.renderer.domElement);
      var spotLightTarget = new Three.Object3D();
      spotLightTarget.position.set(orbitController.target.x, orbitController.target.y, orbitController.target.z);
      scene3D.add(spotLightTarget);
      spotLight1.target = spotLightTarget;

      /************************************/

      var render = function render() {
        if (!_this2.stopRendering) {
          orbitController.update();
          spotLight1.position.set(camera.position.x, camera.position.y, camera.position.z);
          spotLightTarget.position.set(orbitController.target.x, orbitController.target.y, orbitController.target.z);
          camera.updateMatrix();
          camera.updateMatrixWorld();

          _this2.renderer.render(scene3D, camera);
          requestAnimationFrame(render);
        }
      };

      render();

      this.orbitControls = orbitController;
      this.camera = camera;
      this.scene3D = scene3D;
      this.planData = planData;
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.orbitControls.dispose();
      this.stopRendering = true;

      this.renderer.domElement.removeEventListener('mousedown', this.mouseDownEvent);
      this.renderer.domElement.removeEventListener('mouseup', this.mouseUpEvent);

      disposeScene(this.scene3D);
      this.scene3D.remove(this.planData.plan);
      this.scene3D.remove(this.planData.grid);

      this.scene3D = null;
      // this.planData.sceneGraph = null;
      this.planData = null;
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var width = nextProps.width,
          height = nextProps.height;
      var camera = this.camera,
          renderer = this.renderer,
          scene3D = this.scene3D;


      var actions = {
        // areaActions: this.context.areaActions,
        // holesActions: this.context.holesActions,
        itemsActions: this.context.itemsActions,
        // linesActions: this.context.linesActions,
        projectActions: this.context.projectActions
      };

      this.width = width;
      this.height = height;

      camera.aspect = width / height;

      camera.updateProjectionMatrix();

      if (nextProps.state.scene !== this.props.state.scene) {

        var changedValues = diff(this.props.state.scene, nextProps.state.scene);
        updateScene(this.planData, nextProps.state.scene, this.props.state.scene, changedValues.toJS(), actions, this.context.catalog);
      }

      renderer.setSize(width, height);
      //renderer.render(scene3D, camera);
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement("div", {
        ref: "canvasWrapper"
      });
    }
  }]);

  return Present3DViewer;
}(React.Component);

export default Present3DViewer;


Present3DViewer.propTypes = {
  state: React.PropTypes.object.isRequired,
  width: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired
};

Present3DViewer.contextTypes = {
  // areaActions: React.PropTypes.object.isRequired,
  // holesActions: React.PropTypes.object.isRequired,
  itemsActions: React.PropTypes.object.isRequired,
  // linesActions: React.PropTypes.object.isRequired,
  projectActions: React.PropTypes.object.isRequired,
  catalog: React.PropTypes.object
};