const THREE = require('three');
const FACE_SIZE = 30;
const TRI_H = FACE_SIZE * Math.sqrt(3) / 2;
const A14 = Math.PI - (125.264 * Math.PI / 180);

const NET_14 = {
    id: 's0', type: 'square', edge: 0, fa: A14, children: [
        { id: 't1', type: 'triangle', edge: 0, fa: A14, children: [ { id: 's1', type: 'square', edge: 1, fa: A14, children: [ { id: 't5', type: 'triangle', edge: 0, fa: A14, children: [ { id: 's5', type: 'square', edge: 2, fa: A14, children: [] } ]} ]} ]},
        { id: 't2', type: 'triangle', edge: 1, fa: A14, children: [ { id: 's2', type: 'square', edge: 1, fa: A14, children: [ { id: 't6', type: 'triangle', edge: 0, fa: A14, children: [] } ]} ]},
        { id: 't3', type: 'triangle', edge: 2, fa: A14, children: [ { id: 's3', type: 'square', edge: 1, fa: A14, children: [ { id: 't7', type: 'triangle', edge: 0, fa: A14, children: [] } ]} ]},
        { id: 't4', type: 'triangle', edge: 3, fa: A14, children: [ { id: 's4', type: 'square', edge: 1, fa: A14, children: [ { id: 't8', type: 'triangle', edge: 0, fa: A14, children: [] } ]} ]}
    ]
};

function buildAbsoluteLayout(rootDef) {
    const centers = [];
    function traverse(node, parentType, parentAssembled, isRoot) {
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
        localAssembled.multiply(trMat).multiply(rzMat);
        
        if (!isRoot) {
            const rxMat = new THREE.Matrix4().makeRotationX(-node.fa);
            localAssembled.multiply(rxMat);
        }

        const absAssembled = parentAssembled.clone().multiply(localAssembled);

        const centerLocal = new THREE.Vector3(0, node.type === 'square' ? FACE_SIZE/2 : TRI_H/3, 0);
        const centerWorld = centerLocal.clone().applyMatrix4(absAssembled);
        centers.push({ id: node.id, pos: centerWorld });

        if (node.children) {
            for (const child of node.children) traverse(child, node.type, absAssembled, false);
        }
    }
    traverse(rootDef, null, new THREE.Matrix4(), true);
    return centers;
}

const list = buildAbsoluteLayout(NET_14);
const threshold = 1.0;
for (let i = 0; i < list.length; i++) {
    for (let j = i+1; j < list.length; j++) {
        if (list[i].pos.distanceTo(list[j].pos) < threshold) {
            console.log(`OVERLAP DETECTED: ${list[i].id} and ${list[j].id}`);
        }
    }
}
console.log("Validation complete.");
