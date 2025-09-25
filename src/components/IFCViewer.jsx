import React, { useRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { ErrorBoundary } from 'react-error-boundary';


function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-4 bg-red-50 text-red-900 rounded-lg shadow-lg max-w-md mx-auto mt-4 border border-red-200">
      <h2 className="font-bold text-lg mb-2">Something went wrong</h2>
      <p className="text-sm">{error?.message || 'An unexpected error occurred'}</p>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer hover:text-red-700">Details</summary>
        <pre className="mt-1 text-red-700">{error.stack}</pre>
      </details>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors"
      >
        Retry
      </button>
    </div>
  );
}


const IFC_TYPES_MAP = {
  0: 'Unknown',
  1: 'IFCWALL',
  2: 'IFCSLAB',
  3: 'IFCCOLUMN',
  4: 'IFCBEAM',
  5: 'IFCDOOR',
  6: 'IFCWINDOW',
  
};

const loadIFCFile = async (file, onProgress) => {
  return new Promise(async (resolve, reject) => {
    let ifcLoader = null;
    let url = null;

    try {
      console.log('Initializing IFC loader...');
      ifcLoader = new IFCLoader();

     
      try {
        await ifcLoader.ifcManager.setWasmPath('/wasm/');
        console.log('WASM path set to /wasm/');
      } catch (wasmError) {
        console.warn('Failed to set WASM path, trying alternative:', wasmError);
        try {
          await ifcLoader.ifcManager.setWasmPath('./node_modules/web-ifc/');
          console.log('WASM path set to ./node_modules/web-ifc/');
        } catch (secondError) {
          console.warn('Failed to set alternative WASM path:', secondError);
        }
      }

      const arrayBuffer = await new Promise((resolveFile, rejectFile) => {
        const reader = new FileReader();
        reader.onload = (event) => resolveFile(event.target.result);
        reader.onerror = (error) => rejectFile(new Error(`File reading failed: ${error.message}`));
        reader.readAsArrayBuffer(file);
      });

      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      url = URL.createObjectURL(blob);

      console.log('Loading IFC model...');
      const ifcModel = await new Promise((resolveLoad, rejectLoad) => {
        ifcLoader.load(
          url,
          (model) => {
            console.log('IFC model loaded successfully');
            resolveLoad(model);
          },
          (progress) => {
            if (onProgress) onProgress(progress);
            console.log(`Loading progress: ${progress.loaded / progress.total * 100}%`);
          },
          (error) => {
            console.error('IFC loading error:', error);
            rejectLoad(new Error(`Failed to load IFC model: ${error.message || error}`));
          }
        );
      });

      console.log('Processing IFC model...');
      const modelID = ifcModel.modelID;
      const geometry = ifcModel.geometry;

      if (!geometry.getAttribute('expressID')) {
        throw new Error('No expressID attribute found in geometry');
      }

      const expressIDAttr = geometry.getAttribute('expressID');
      const idsArray = expressIDAttr.array;
      const uniqueIDs = new Set();
      for (let i = 0; i < idsArray.length; i++) {
        const id = idsArray[i];
        if (id > 0) uniqueIDs.add(id);
      }

      console.log(`Found ${uniqueIDs.size} unique expressIDs with geometry`);

      const components = [];
      let processedCount = 0;
      let failedCount = 0;

      for (const id of uniqueIDs) {
        try {
          const subset = ifcLoader.ifcManager.createSubset({
            modelID,
            ids: [id],
            removePrevious: false,
            material: undefined
          });

          const props = await ifcLoader.ifcManager.getItemProperties(modelID, id, true);
          if (!props || typeof props.type === 'undefined') {
            console.warn(`Skipping expressID ${id}: Invalid properties`);
            failedCount++;
            continue;
          }
          const name = props.Name?.value || `ID ${id}`;
          const typeCode = props.type || 0;
          console.log(`Processing expressID ${id}, typeCode: ${typeCode}, props:`, props);
          const typeName = IFC_TYPES_MAP[typeCode] || `Type_${typeCode}` || 'Unknown';

          components.push({
            id,
            name,
            type: typeName,
            mesh: subset,
            visible: true,
            highlighted: false,
            initialPosition: subset.position.clone() 
          });

          processedCount++;
        } catch (itemError) {
          console.warn(`Failed to process expressID ${id}:`, itemError);
          failedCount++;
        }
      }

      console.log(`Processing complete: ${processedCount} successful, ${failedCount} failed`);

      if (components.length > 0) {
        console.log(`Successfully processed ${components.length} IFC components`);
        resolve({ components, model: ifcModel, ifcManager: ifcLoader.ifcManager, modelID });
      } else {
        reject(new Error('No valid components could be extracted from the IFC file'));
      }

    } catch (error) {
      console.error('IFC loading error:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';

      if (errorMessage.includes('WASM') || errorMessage.includes('WebAssembly')) {
        reject(new Error('WebAssembly initialization failed. Please refresh the page and try again.'));
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        reject(new Error('Network error while loading IFC file. Please check your connection.'));
      } else {
        reject(new Error(`Failed to load IFC file: ${errorMessage}`));
      }
    } finally {
      if (url) {
        URL.revokeObjectURL(url);
        console.log('Blob URL cleaned up');
      }
    }
  });
};

function SceneSetup({ onSceneClick }) {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  useEffect(() => {
    const handleClick = (event) => {
      mouse.current.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const intersection = intersects[0];
        onSceneClick(intersection);
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [camera, scene, gl, onSceneClick]);

  return null;
}

function MeasurementSystem({ isActive, onMeasurementComplete }) {
  const { camera, scene, gl } = useThree();
  const [points, setPoints] = useState([]);
  const [lines, setLines] = useState([]);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  useEffect(() => {
    const handleClick = (event) => {
      if (!isActive) return;

      mouse.current.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const newPoint = intersects[0].point.clone();

        if (points.length === 0) {
          setPoints([newPoint]);
        } else if (points.length === 1) {
          const point1 = points[0];
          const point2 = newPoint;
          const distance = point1.distanceTo(point2);

          const lineGeometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);
          const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
          const line = new THREE.Line(lineGeometry, lineMaterial);

          setPoints([point1, point2]);
          setLines([line]);

          onMeasurementComplete(point1, point2, distance);
        }
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [isActive, points, camera, scene, gl, onMeasurementComplete]);

  useEffect(() => {
    if (!isActive) {
      setPoints([]);
      setLines([]);
    }
  }, [isActive]);

  return (
    <>
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={0xff0000} />
        </mesh>
      ))}
      {lines.map((line, index) => (
        <primitive key={index} object={line} />
      ))}
    </>
  );
}

function ClippingPlanes({ isSplitMode, splitPosition, clipAxis }) {
  const { scene } = useThree();

  useEffect(() => {
    if (!isSplitMode) {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(mat => {
            mat.clippingPlanes = [];
            mat.needsUpdate = true;
          });
        }
      });
      return;
    }

    const normal = new THREE.Vector3(
      clipAxis === 'x' ? 1 : 0,
      clipAxis === 'y' ? 1 : 0,
      clipAxis === 'z' ? 1 : 0
    );
    const plane = new THREE.Plane(normal, -splitPosition / 10);
    const planeHelper = new THREE.PlaneHelper(plane, 10, 0x00ff00);
    scene.add(planeHelper);

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(mat => {
          mat.clippingPlanes = [plane];
          mat.needsUpdate = true;
        });
      }
    });

    return () => {
      scene.remove(planeHelper);
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(mat => {
            mat.clippingPlanes = [];
            mat.needsUpdate = true;
          });
        }
      });
    };
  }, [isSplitMode, splitPosition, clipAxis, scene]);

  return null;
}

function IFCModel({ components }) {
  const groupRef = useRef();

  useEffect(() => {
    components.forEach((component) => {
      const mesh = component.mesh;
      if (mesh && mesh.material) {
        if (component.highlighted) {
          if (!mesh.userData.originalMaterial) {
            mesh.userData.originalMaterial = mesh.material;
          }
          mesh.material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
          });
          mesh.material.needsUpdate = true;
        } else if (mesh.userData.originalMaterial) {
          mesh.material = mesh.userData.originalMaterial;
          delete mesh.userData.originalMaterial;
          mesh.material.needsUpdate = true;
        }
        mesh.visible = component.visible;
      } else {
        console.warn(`Skipping highlight for component ${component.id}: No valid mesh or material`);
      }
    });
  }, [components]);

  return (
    <group ref={groupRef}>
      {components.map((component) => (
        <primitive
          key={component.id}
          object={component.mesh}
          visible={component.visible}
        />
      ))}
    </group>
  );
}

export default function IFCViewer({
  components = [],
  onComponentUpdate,
  onClearComponents,
  currentViewMode = 'isometric',
  wireframeEnabled = false,
  gridEnabled = true,
  isSplitMode = false,
  explodeAmount = 0,
  setExplodeAmount
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [originalCentroids, setOriginalCentroids] = useState([]);
  const [viewMode, setViewMode] = useState(currentViewMode);
  const [localWireframeEnabled, setLocalWireframeEnabled] = useState(wireframeEnabled);
  const [localGridEnabled, setLocalGridEnabled] = useState(gridEnabled);
  const [isSplitModeLocal, setIsSplitModeLocal] = useState(isSplitMode);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [showComponentsList, setShowComponentsList] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [properties, setProperties] = useState(null);
  const [ifcManager, setIfcManager] = useState(null);
  const [modelID, setModelID] = useState(null);
  const [clipAxis, setClipAxis] = useState('x');
  const controlsRef = useRef();

  const isDevelopment = process.env.NODE_ENV === 'development';

 
  useEffect(() => {
    setIsSplitModeLocal(isSplitMode);
  }, [isSplitMode]);

  
  useEffect(() => {
    if (components.length > 0 && originalCentroids.length === 0) {
      const modelBox = new THREE.Box3();
      components.forEach((c) => {
        if (c.mesh && c.mesh.geometry) {
          if (!c.mesh.geometry.boundingBox) {
            c.mesh.geometry.computeBoundingBox();
          }
          modelBox.expandByObject(c.mesh);
        }
      });

      const modelSize = modelBox.getSize(new THREE.Vector3()).length();
      const centroids = components.map((c) => {
        const mesh = c.mesh;
        if (!mesh || !mesh.geometry) {
          console.warn(`Skipping centroid computation for component ${c.id}: Invalid mesh or geometry`);
          return new THREE.Vector3();
        }
        if (!mesh.geometry.boundingBox) {
          mesh.geometry.computeBoundingBox();
        }
        const center = new THREE.Vector3();
        mesh.geometry.boundingBox.getCenter(center);
        mesh.updateMatrixWorld(); 
        center.applyMatrix4(mesh.matrixWorld); 
        console.log(`Component ${c.id} centroid:`, center);
        return center;
      });
      setOriginalCentroids(centroids);
      console.log(`Model bounding box size: ${modelSize}`);
    } else if (components.length === 0) {
      setOriginalCentroids([]);
    }
  }, [components]);


  useEffect(() => {
    if (!components || components.length === 0 || originalCentroids.length === 0) {
      console.log('Explode skipped: No components or centroids');
      return;
    }

    const modelBox = new THREE.Box3();
    components.forEach((c) => {
      if (c.mesh && c.mesh.geometry) {
        if (!c.mesh.geometry.boundingBox) {
          c.mesh.geometry.computeBoundingBox();
        }
        modelBox.expandByObject(c.mesh);
      }
    });
    const modelCenter = new THREE.Vector3();
    modelBox.getCenter(modelCenter);
    const modelSize = modelBox.getSize(new THREE.Vector3()).length();

    components.forEach((component, i) => {
      const mesh = component.mesh;
      if (!mesh || !mesh.geometry || !component.initialPosition) {
        console.warn(`Skipping explode for component ${component.id}: Invalid mesh, geometry, or initial position`);
        return;
      }


      mesh.position.copy(component.initialPosition);

      if (explodeAmount > 0) {
        const centroid = originalCentroids[i];
        const direction = new THREE.Vector3().subVectors(centroid, modelCenter).normalize();
    
        const offset = direction.multiplyScalar(explodeAmount * modelSize * 0.5);
        mesh.position.add(offset);
        console.log(`Component ${component.id} exploded: offset=${offset}, new position=${mesh.position}`);
      }
    });
  }, [explodeAmount, components, originalCentroids]);


  useEffect(() => {
    components.forEach((component) => {
      const mesh = component.mesh;
      if (mesh && mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          mat.wireframe = localWireframeEnabled;
          mat.needsUpdate = true;
        });
      } else {
        console.warn(`Skipping wireframe for component ${component.id}: No valid mesh or material`);
      }
    });
  }, [localWireframeEnabled, components]);


  useEffect(() => {
    const loadProperties = async () => {
      if (ifcManager && modelID && selectedId) {
        try {
          const props = await ifcManager.getItemProperties(modelID, selectedId, true);
          setProperties(props);
        } catch (err) {
          console.error('Failed to load properties:', err);
          setProperties(null);
        }
      } else {
        setProperties(null);
      }
    };
    loadProperties();
  }, [selectedId, ifcManager, modelID]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.ifc')) {
      setError({ title: 'Invalid File', message: 'Please select a valid IFC file (.ifc extension required).' });
      return;
    }

    const maxSize = 100 * 1024 * 1024; 
    if (file.size > maxSize) {
      setError({ title: 'File Too Large', message: 'File size exceeds 100MB limit.' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loadIFCFile(file);
      onComponentUpdate(result.components);
      setIfcManager(result.ifcManager);
      setModelID(result.modelID);
    } catch (err) {
      setError({ title: 'Loading Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadFileFromPublic = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/AC20-Institute-Var-2.ifc');
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const file = new File([arrayBuffer], 'AC20-Institute-Var-2.ifc', { type: 'application/octet-stream' });
      const result = await loadIFCFile(file);
      onComponentUpdate(result.components);
      setIfcManager(result.ifcManager);
      setModelID(result.modelID);
    } catch (err) {
      setError({ title: 'Loading Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClearIFCFile = () => {
    if (onClearComponents) onClearComponents();
    if (ifcManager) {
      ifcManager.dispose();
      setIfcManager(null);
    }
    setModelID(null);
    setOriginalCentroids([]);
    setSelectedId(null);
    setProperties(null);
    setShowComponentsList(false);
    setIsMeasuring(false);
    setError(null);
    setLoading(false);
    setIsSplitModeLocal(false);
    setSplitPosition(50);
    setClipAxis('x');
    const fileInput = document.querySelector('input[type="file"][accept=".ifc"]');
    if (fileInput) fileInput.value = '';
  };

  const handleSceneClick = (intersection) => {
    const mesh = intersection.object;
    if (mesh.userData && mesh.userData.expressID) {
      setSelectedId(mesh.userData.expressID);
      onComponentUpdate(components.map(c => ({
        ...c,
        highlighted: c.id === mesh.userData.expressID
      })));
    }
  };

  const handleMeasurementComplete = (p1, p2, distance) => {
    alert(`Distance: ${distance.toFixed(2)} units`);
    setIsMeasuring(false);
  };

  const handleToggleComponentsList = () => {
    setShowComponentsList(!showComponentsList);
  };

  const handleToggleMeasurement = () => {
    setIsMeasuring(!isMeasuring);
  };

  const handleToggleSplitMode = () => {
    setIsSplitModeLocal(!isSplitModeLocal);
  };

  const handleSplitPositionChange = (position) => {
    setSplitPosition(position);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (controlsRef.current) {
      const controls = controlsRef.current;
      switch (mode) {
        case 'top':
          controls.object.position.set(0, 10, 0);
          controls.target.set(0, 0, 0);
          break;
        case 'front':
          controls.object.position.set(0, 0, 10);
          controls.target.set(0, 0, 0);
          break;
        case 'right':
          controls.object.position.set(10, 0, 0);
          controls.target.set(0, 0, 0);
          break;
        case 'isometric':
          controls.object.position.set(10, 10, 10);
          controls.target.set(0, 0, 0);
          break;
      }
      controls.update();
    }
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.multiplyScalar(0.9);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.multiplyScalar(1.1);
      controlsRef.current.update();
    }
  };

  const handleFitToView = () => {
    if (controlsRef.current && components.length > 0) {
      const box = new THREE.Box3();
      components.forEach(c => {
        if (c.mesh.geometry.boundingBox) {
          box.expandByObject(c.mesh);
        }
      });
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = controlsRef.current.object.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5;
      controlsRef.current.object.position.set(center.x, center.y, center.z + cameraZ);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => console.error('Error in IFCViewer:', error, info)}
      onReset={() => {
        setError(null);
        setLoading(false);
        onComponentUpdate([]);
      }}
    >
      <div className="w-full h-full flex flex-col bg-gray-100">
        {/* Toolbar */}
        <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* View Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleViewModeChange('top')}
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded transition-colors"
                title="Top View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('front')}
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded transition-colors"
                title="Front View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('right')}
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded transition-colors"
                title="Right View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18M21 3v18M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('isometric')}
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded transition-colors"
                title="Isometric View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleZoomIn}
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded transition-colors"
                title="Zoom In"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded transition-colors"
                title="Zoom Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <button
                onClick={handleFitToView}
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded transition-colors"
                title="Fit to View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l4 4m8 0v4m0-4h-4m4 0l-4 4M4 16v4m0 0h4m-4 0l4-4m8 0v-4m0 4h-4m4 0l-4-4" />
                </svg>
              </button>
            </div>

            {/* Display Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setLocalWireframeEnabled(!localWireframeEnabled)}
                className={`p-2 rounded transition-colors ${localWireframeEnabled ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'}`}
                title="Toggle Wireframe"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7V3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1zM3 17v4a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1zM13 7V3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1zM13 17v4a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 00-1-1h-4a1 1 0 00-1 1z" />
                </svg>
              </button>
              <button
                onClick={() => setLocalGridEnabled(!localGridEnabled)}
                className={`p-2 rounded transition-colors ${localGridEnabled ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'}`}
                title="Toggle Grid"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={handleToggleSplitMode}
                className={`p-2 rounded transition-colors ${isSplitModeLocal ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'}`}
                title="Toggle Split View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={handleToggleMeasurement}
                className={`p-2 rounded transition-colors ${isMeasuring ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'}`}
                title="Measure"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17l3-2.94m0 0l3 2.94M12 14.06V3" />
                </svg>
              </button>
              <button
                onClick={handleToggleComponentsList}
                className={`p-2 rounded transition-colors ${showComponentsList ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'}`}
                title="Components List"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            {/* Clipping Axis Selector */}
            <select
              value={clipAxis}
              onChange={(e) => setClipAxis(e.target.value)}
              className="p-2 rounded bg-gray-300 text-gray-900 text-sm"
              title="Select Clipping Axis"
            >
              <option value="x">X-Axis</option>
              <option value="y">Y-Axis</option>
              <option value="z">Z-Axis</option>
            </select>

            {/* Explode Slider */}
            <div className="flex items-center space-x-2">
              <label className="text-sm">Explode:</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={explodeAmount}
                onChange={(e) => setExplodeAmount(parseFloat(e.target.value))}
                className="w-32"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearIFCFile}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
              title="Clear Model"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Inline Split Controls */}
        {isSplitModeLocal && (
          <div className="bg-gray-200 border-b border-gray-300 px-4 py-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm">Split Position:</label>
              <input
                type="range"
                min={0}
                max={100}
                value={splitPosition}
                onChange={(e) => handleSplitPositionChange(parseFloat(e.target.value))}
                className="w-32"
              />
            </div>
          </div>
        )}

        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <Canvas
            camera={{ position: [10, 10, 10], fov: 75 }}
            gl={{ localClippingEnabled: true }}
            style={{ background: '#f8f9fa' }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Environment preset="city" />

            {localGridEnabled && (
              <Grid
                position={[0, -0.01, 0]}
                args={[20, 20]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#333333"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#555555"
                fadeDistance={30}
                fadeStrength={1}
                followCamera={false}
                infiniteGrid={true}
              />
            )}

            <IFCModel components={components} />

            <ClippingPlanes
              isSplitMode={isSplitModeLocal}
              splitPosition={splitPosition}
              clipAxis={clipAxis}
            />

            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1}
              maxDistance={100}
            />

            <SceneSetup onSceneClick={handleSceneClick} />

            <MeasurementSystem
              isActive={isMeasuring}
              onMeasurementComplete={handleMeasurementComplete}
            />
          </Canvas>

          {/* File Upload Overlay */}
          <div className="absolute top-4 left-4 z-10 flex space-x-2">
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer shadow-lg transition-colors flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>{loading ? 'Loading...' : 'Load IFC File'}</span>
              <input
                type="file"
                accept=".ifc"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
            </label>
            <button
              onClick={loadFileFromPublic}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{loading ? 'Loading...' : 'Load from Public'}</span>
            </button>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-gray-200 p-6 rounded-lg shadow-xl border border-gray-300">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <p className="text-lg text-gray-900">Loading IFC file...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute top-4 right-4 bg-red-50 text-red-900 p-4 rounded-lg shadow-lg max-w-md z-50 border border-red-200">
              <div className="font-bold text-sm mb-1">{error.title}</div>
              <p className="text-sm">{error.message}</p>
              {error.details && isDevelopment && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer hover:text-red-700">Technical Details</summary>
                  <p className="mt-1 text-red-700">{error.details}</p>
                </details>
              )}
              <button
                onClick={() => setError(null)}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Debug Info */}
          {isDevelopment && (
            <div className="absolute bottom-4 left-4 bg-gray-50 text-gray-900 p-3 rounded-lg text-xs font-mono max-w-sm border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold">Debug Info</h4>
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {showDebugInfo ? 'Hide' : 'Show'}
                </button>
              </div>
              {showDebugInfo && (
                <div className="space-y-1">
                  <div>Components: {components?.length || 0}</div>
                  <div>Loading: {loading ? 'Yes' : 'No'}</div>
                  <div>Error: {error ? 'Yes' : 'No'}</div>
                  <div>View Mode: {viewMode}</div>
                  <div>Wireframe: {localWireframeEnabled ? 'On' : 'Off'}</div>
                  <div>Grid: {localGridEnabled ? 'On' : 'Off'}</div>
                  <div>Split Mode: {isSplitModeLocal ? 'On' : 'Off'}</div>
                  <div>Clip Axis: {clipAxis.toUpperCase()}</div>
                  <div>Explode Amount: {explodeAmount.toFixed(2)}</div>
                </div>
              )}
            </div>
          )}

          {/* Components List Panel */}
          {showComponentsList && components.length > 0 && (
            <div className="absolute top-0 right-0 w-64 h-full bg-white overflow-y-auto p-4 shadow-lg z-50">
              <h3 className="font-bold mb-2">Components</h3>
              {components.map((c) => (
                <div
                  key={c.id}
                  className={`p-1 cursor-pointer ${c.highlighted ? 'bg-yellow-200' : ''} ${selectedId === c.id ? 'bg-blue-100' : ''}`}
                  onClick={() => {
                    setSelectedId(c.id);
                    onComponentUpdate(components.map(comp => ({
                      ...comp,
                      highlighted: comp.id === c.id
                    })));
                  }}
                >
                  <input
                    type="checkbox"
                    checked={c.visible}
                    onChange={(e) => onComponentUpdate(components.map(comp => comp.id === c.id ? { ...comp, visible: e.target.checked } : comp))}
                  />
                  <span className="ml-2">{c.name} ({c.type})</span>
                </div>
              ))}
            </div>
          )}

          {/* Properties Panel */}
          {properties && (
            <div className="absolute bottom-0 right-0 w-64 bg-white p-4 shadow-lg max-h-64 overflow-y-auto z-50">
              <h3 className="font-bold mb-2">Properties</h3>
              <pre className="text-xs">{JSON.stringify(properties, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}