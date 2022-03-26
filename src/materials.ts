import * as THREE from 'three';
import { Colors } from './colors';

export class Materials {

    public static Standard(): THREE.MeshPhysicalMaterial {
        return new THREE.MeshPhysicalMaterial({
            color: Colors.AlmostWhite,
            metalness: 0,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 1.0,
            reflectivity: 1.0,
            envMap: null,
        });
    }
    
}