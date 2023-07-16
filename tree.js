class Node {
    constructor(value, display) {
        this.parent = null;
        this.value = value;
        this.display = display;
        this.children = [];
        this.depth = 0;
    }

    addChild(node) {
        this.children.push(node);
    }

    addParent(node) {
        this.parent = node;
        this.depth = this.calculateDepth(this);
    }

    calculateDepth(node) {
        let depth = 0;
        let currentNode = node;
        while (currentNode.parent) {
            depth++;
            currentNode = currentNode.parent;
        }
        return depth;
    }
}

class Tree {
    constructor(objects, childRef, parentRef, valueAttr = "_id", displayAttr = valueAttr) {
        this.valueAttr = valueAttr;
        this.displayAttr = displayAttr;
        this.nodes = {};
        this.rootNodes = [];

        for (const obj of objects) {
            if (obj[valueAttr] === null || obj[valueAttr] === undefined ){
                throw Error("All nodes must have values");
            } 
            const node = this.getOrCreateNode(obj);
            let parentNode = null;
            if (obj[parentRef]) {
                parentNode = this.getOrCreateNode(obj[parentRef]);
            }
            const childNodes = obj[childRef] || [];

            if (parentNode) {
                node.addParent(parentNode);
            } else {
                this.rootNodes.push(node);
            }

            for (const child of childNodes) {
                const childNode = this.getOrCreateNode(child);
                node.addChild(childNode)
            }
        }
    }

    traverse(callback) {
        for (const rootNode of this.rootNodes) {
            this._preOrderDFS(rootNode, callback);
        }
    }

    _preOrderDFS(node, callback) {
        callback(node);
        for (const child of node.children) {
            this._preOrderDFS(child, callback);
        }
    }

    // Relies on values being unique
    getOrCreateNode(obj) {
        const key = obj[this.valueAttr];
        const display = obj[this.displayAttr];
        if (!this.nodes[key]) {
            this.nodes[key] = new Node(key, display);
        }
        return this.nodes[key];
    }

    getNodes() {
        const nodes = [];
        this.traverse((node) => {
            nodes.push(node);
        });
        return nodes;
    }

    print() {
        this.traverse((node) => {
            console.log(`${node.display} ${node.children.length ? "-> " + node.children.map(({ display }) => display).join(", ") : ""}`);
        });
    }
}

 const testObjs = [
     { name: "Ca", anscestor: {name:"B"}},
     { name: "A", descendants: [{name:"B"}] },
     { name: "C", descendants: [{name:"D"}], anscestor: {name:"B"} },
     { name: "D", anscestor: {name:"C"} },
     { name: "B", descendants: [{name:"C"}, {name:"Ca"}], anscestor: {name:"A"} }
 ]

const myTree = new Tree(testObjs, "descendants", "anscestor", "name");
myTree.print()

module.exports = { Tree }