import * as THREE from 'three';
import { Colors } from './colors';

export class Materials {

    public static Standard(): THREE.MeshPhysicalMaterial {
        return new THREE.MeshPhysicalMaterial({
            color: Colors.AlmostWhite,
            metalness: 0,
            roughness: 0.3,
            reflectivity: 0.5,
            envMap: null,
        });
    }
    
}