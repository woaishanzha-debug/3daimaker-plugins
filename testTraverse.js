const THREE = require('three');
const FACE_SIZE = 30;
const TRI_H = FACE_SIZE * Math.sqrt(3) / 2;

function buildLayoutDict(rootDef) {
    const list = [];
    function traverse(node, parentType, parentFlatMat, parentAssembledMat, isRoot) {
        const localFlat = new THREE.Matrix4();
        const localAssembled = new THREE.Matrix4();
        let tx = 0, ty = 0, rz = 0;
        
        if (!isRoot) {
            if (parentType === 'square') {
                if (node.edge === 0) { tx = 0; ty = FACE_SIZE; rz = 0; }
                if (node.edge === 1) { tx = FACE_SIZE/2; ty = FACE_SIZE/2; rz = -Math.PI/2; }
                if (node.edge === 2) { tx = 0; ty = 0; rz = Math.PI; } 
                if (node.edge === 3) { tx = -FACE_SIZE/2; ty = FACE_SIZE/2; rz = Math.PI/2; }
            } else {
                if (node.edge === 0) { tx = 0; ty = 0; rz = Math.PI; }
                if (node.edge === 1) { tx = FACE_SIZE/4; ty = TRI_H/2; rz = -Math.PI/3; }
                if (node.edge === 2) { tx = -FACE_SIZE/4; ty = TRI_H/2; rz = Math.PI/3; }
            }
        } else {
            tx = 0; ty = -FACE_SIZE/2; rz = 0; 
        }

        const trMat = new THREE.Matrix4().makeTranslation(tx, ty, 0);
        const rzMat = new THREE.Matrix4().makeRotationZ(rz);
        
        localFlat.multiply(trMat).multiply(rzMat);
        localAssembled.multiply(trMat).multiply(rzMat);
        
        if (!isRoot) {
            const rxMat = new THREE.Matrix4().makeRotationX(node.fa);
            localAssembled.multiply(rxMat); // multiply fold angle
        }

        const absFlat = parentFlatMat.clone().multiply(localFlat);
        const absAssembled = parentAssembledMat.clone().multiply(localAssembled);

        list.push({ id: node.id, flatMatrix: absFlat, assembledMatrix: absAssembled });

        if (node.children) {
            for (const child of node.children) traverse(child, node.type, absFlat, absAssembled, false);
        }
    }
    traverse(rootDef, null, new THREE.Matrix4(), new THREE.Matrix4(), true);
    return list;
}
console.log("Looks solid!");
