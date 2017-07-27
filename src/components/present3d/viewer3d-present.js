"use strict";

import React from 'react';
import ReactDOM from 'react-dom';
import * as Three from 'three';
import {parseData, updateScene} from './scene-creator';
import {disposeScene} from './three-memory-cleaner';
import OrbitControls from './libs/orbit-controls';
import diff from 'immutablediff';

export default class Present3DViewer extends React.Component {

  constructor(props) {
    super(props);

    this.lastMousePosition = {};
    this.width = props.width;
    this.height = props.height;
    this.stopRendering = false;

    this.renderer = window.__threeRenderer || new Three.WebGLRenderer({preserveDrawingBuffer: true});
    window.__threeRenderer = this.renderer;
  }

  componentDidMount() {

    let actions = {
      // areaActions: this.context.areaActions,
      // holesActions: this.context.holesActions,
      itemsActions: this.context.itemsActions,
      // linesActions: this.context.linesActions,
      projectActions: this.context.projectActions
    };

    let {state} = this.props;
    let data = state.scene;
    let canvasWrapper = ReactDOM.findDOMNode(this.refs.canvasWrapper);

    let scene3D = new Three.Scene();

    //RENDERER
    this.renderer.setClearColor(new Three.Color(0xffffff));
    this.renderer.setSize(this.width, this.height);

    // LOAD DATA
    let planData = parseData(data, actions, this.context.catalog);

    scene3D.add(planData.plan);
    scene3D.add(planData.grid);

    let aspectRatio = this.width / this.height;
    let camera = new Three.PerspectiveCamera(40, aspectRatio, 1, 300000);

    scene3D.add(camera);

    // Set position for the camera
    let cameraPositionX = (planData.boundingBox.max.x - planData.boundingBox.min.x) ;
    let cameraPositionY = (planData.boundingBox.max.y - planData.boundingBox.min.y);
    let cameraPositionZ = (planData.boundingBox.max.z - planData.boundingBox.min.z);

    camera.position.set(0, 4000, 3000);
    camera.lookAt(0, 0, 0);
    // camera.up = new Three.Vector3(0, 1, 0);

    // HELPER AXIS
    // let axisHelper = new Three.AxisHelper(100);
    // scene3D.add(axisHelper);

    // LIGHT
    let light = new Three.AmbientLight(0xafafaf); // soft white light
    scene3D.add(light);

    // Add another light

    let spotLight1 = new Three.SpotLight(0xffffff, 0.30);
    spotLight1.position.set(cameraPositionX, cameraPositionY, cameraPositionZ);
    scene3D.add(spotLight1);

    // OBJECT PICKING
    let toIntersect = [planData.plan];
    let mouse = new Three.Vector2();
    let raycaster = new Three.Raycaster();

    this.mouseDownEvent = (event) => {
      this.lastMousePosition.x = event.offsetX / this.width * 2 - 1;
      this.lastMousePosition.y = -event.offsetY / this.height * 2 + 1;
    };

    this.mouseUpEvent = (event) => {
      event.preventDefault();

      mouse.x = (event.offsetX / this.width) * 2 - 1;
      mouse.y = -(event.offsetY / this.height) * 2 + 1;

      if (Math.abs(mouse.x - this.lastMousePosition.x) <= 0.02 && Math.abs(mouse.y - this.lastMousePosition.y) <= 0.02) {

        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(toIntersect, true);

        if (intersects.length > 0) {

          let type = intersects[0].object.type;
          if (type === 'wall' || type === 'window' || type === 'area') return;

          intersects[0].object.interact && intersects[0].object.interact();
        } else {
          this.context.projectActions.unselectAll();
        }
      }
    };

    this.renderer.domElement.addEventListener('mousedown', this.mouseDownEvent);
    this.renderer.domElement.addEventListener('mouseup', this.mouseUpEvent);

    // add the output of the renderer to the html element
    canvasWrapper.appendChild(this.renderer.domElement);

    // create orbit controls
    let orbitController = new OrbitControls(camera, this.renderer.domElement);
    let spotLightTarget = new Three.Object3D();
    spotLightTarget.position.set(orbitController.target.x, orbitController.target.y, orbitController.target.z);
    scene3D.add(spotLightTarget);
    spotLight1.target = spotLightTarget;


    /************************************/

    let render = () => {
      if (!this.stopRendering) {
        orbitController.update();
        spotLight1.position.set(camera.position.x, camera.position.y, camera.position.z);
        spotLightTarget.position.set(orbitController.target.x, orbitController.target.y, orbitController.target.z);
        camera.updateMatrix();
        camera.updateMatrixWorld();

        this.renderer.render(scene3D, camera);
        requestAnimationFrame(render);
      }
    };

    render();

    this.orbitControls = orbitController;
    this.camera = camera;
    this.scene3D = scene3D;
    this.planData = planData;
  }

  componentWillUnmount() {
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

  componentWillReceiveProps(nextProps) {
    let {width, height} = nextProps;
    let {camera, renderer, scene3D} = this;

    let actions = {
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

      let changedValues = diff(this.props.state.scene, nextProps.state.scene);
      updateScene(this.planData, nextProps.state.scene, this.props.state.scene, changedValues.toJS(), actions, this.context.catalog);
    }

    renderer.setSize(width, height);
    //renderer.render(scene3D, camera);
  }

  render() {
    return React.createElement("div", {
      ref: "canvasWrapper"
    });
  }
}

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
