
class DisjointSet{
    constructor(){
        this.parent = new Map();
        this.rank = new Map();
    }

    make_set(label){
        // Make itself the 'label' for this connected component
        this.parent.set(label, label);
        this.rank.set(label, 0);
    }

    union(label_a, label_b){
        this.link(this.find(label_a), this.find(label_b));
    }

    /**\
     * Find what component the label (vertex) is in
     * 
     * Recall components are 'labeled' by one of the vertices inside of them that is the root of that component subtree
     * 
     * Ex: If (1,1) does not have (1,1) as a parent, then it is part of a larger component
     * Keep traversing up parent tree until get parent as itself, this is the root that defines the component
     * Return that - (1,1) is inside the component labelled by that vertex
     * 
     * @param {*} label 
     * @returns 
     */
    find(label){
        if(!this.parent.has(label)){
            // This vertex has not yet been added to the disjoint set, return no component
            return undefined;
        }

        if(this.parent.get(label) != label){
            // Path compression
            this.parent.set(label, this.find(this.parent.get(label)));
        }

        // At this point path-compressed so can return directly
        return this.parent.get(label);
    }

    /**
     * Combine two connected components (merge sets)
     * @param {*} component_a 
     * @param {*} component_b 
     */
    link(component_a, component_b){
        if(this.rank.get(component_a) > this.rank.get(component_b)){
            // Choose smaller component to be subcomponent to reduce find (path compression) work later
            this.parent.set(component_b, component_a);
        }
        else{
            this.parent.set(component_a, component_b);
            if (this.rank.get(component_a) == this.rank.get(component_b)){
                this.rank.set(component_b, this.rank.get(component_b) + 1);
            }
        }
    }
}


class TreeNode{
    constructor(vertex, children, parents, value){
        this.vertex = vertex;
        this.children = children; // set of children
        this.parents = parents; // set of parents
        this.value = value;
    }
}

class Tree {
    constructor(){
        this.vertex_to_node = new Map();
    }

    /**
     * TODO: move this out maybe into another func and just return the set
     * 
     * Go through all vertices and find 'significant' nodes
     * 
     * IE, if they are root (parents is empty), leaf (children is empty), or merge (multiple parents) 
     * @returns 
     */
    compute_significants(){
        const significants = new Set();
        const sigroots = new Set();

        this.vertex_to_node.forEach((node, vert) => {
            if(node.parents.size == 0){
                // Root
                significants.add(vert);
                sigroots.add(vert);
            }
            else if(node.children.size == 0){
                // Leaf
                significants.add(vert);
            }
            else if(node.parents.size > 1){
                // Merge
                significants.add(vert);
            }
            else if(node.children.size > 1){
                // Merge, but in opposite direction
                // NOTE: Should ONLY be done on contour tree! check if JT/ST is in here, then something went wrong
                significants.add(vert);
            }

        })
        return [significants, sigroots];
    }

    gen_sigtree(significants_verts, sigroots_verts){

        /**
         * Returns list of walking down all branches from this node until we hit a significant node in that branch
         * 
         * @param {*} node 
         * @returns 
         */
        function walk_to_next_sig(node){
            const next_sigs = [];
            const walk_stack = [...node.children];
            // Don't need marked here b/c assume no cycles
            while (walk_stack.length > 0){
                const successor_node = walk_stack.pop();

                if (significants.has(successor_node)){
                    next_sigs.push(successor_node);
                }
                else{
                    walk_stack.push(...successor_node.children)
                }
            }
            return next_sigs;
        }

        // We want to append all roots first and then walk down the tree to get the connections
        const sigtree = new Tree();
        const significants = new Set([...significants_verts].map(v => this.vertex_to_node.get(v)));
        const sigroots = new Set([...sigroots_verts].map(v => this.vertex_to_node.get(v)));

        const stack = [...sigroots];
        const marked = new Set();

        // Add all vertices to new tree
        significants.forEach((significant_vert) => {
            sigtree.add_node(significant_vert.vertex, significant_vert.value);
        })

        while (stack.length > 0){
            const signode = stack.pop();
            if(!marked.has(signode)){
                marked.add(signode);
                const next_connected_significants = walk_to_next_sig(signode); // children significants of this signode
                for (const next_signode of next_connected_significants){
                    // Add edge from current node to its successors
                    sigtree.connect_nodes(signode.vertex, next_signode.vertex);
                    // Add all successor significants to queue
                    stack.push(next_signode);
                }
            }
        }

        return sigtree;
    }

    get_node(vert){
        // Will give undefined if doesn't exist
        return this.vertex_to_node.get(vert);
    }

    is_root(vert){
        return this.degree(vert) == 0;
    }

    /**
     * For both the join and split trees, we have the upper/lower leaves as just when no parents
     * 
     * As for join tree, upper leaves with no parents will be at the top, but for split tree we draw it upside down, so the lower leaves are also at the top with no parents
     * @param {*} vert 
     * @returns 
     */
    degree(vert){
        return this.vertex_to_node.get(vert).parents.size;
    }

    add_node(vertex, value){
        var node = this.get_node(vertex);
        if(node === undefined){
            node = new TreeNode(vertex, new Set(), new Set(), value);
            this.vertex_to_node.set(vertex, node);

            // Did create
            return true;
        }

        // Did not create
        return false;
    }

    connect_nodes(parent, child){
        const parent_node = this.get_node(parent);
        const child_node = this.get_node(child);

        if ((parent_node === undefined) || (child_node === undefined)){
            throw new Error("Nodes being connected have not been added to the graph yet");
        }

        child_node.parents.add(parent_node);
        parent_node.children.add(child_node);
    }

    get_children(vert){
        return this.vertex_to_node.get(vert).children;
    }

    /**
     * Performs a reduction
     * 
     * if a->b->c, and we reduce_vert(b), we expect a final graph a->c
     * 
     * Children of b should connect into parent of c
     * @param {int} vert 
     */
    reduce_vert(vert){
        const node = this.get_node(vert);

        if (node.parents.size > 1){
            // We shouldn't get this for a contour tree
            throw new Error("Multiple parents on node getting reduced, not possible on CT I think...?");
        }

        for (const child_node of node.children){
            child_node.parents.delete(node);
            
            // This should really never happen for contour tree... so if we have more than 1 parents something went wrong
            for (const parent_node of node.parents){
               child_node.parents.add(parent_node);
            }
        }
        // Again, should really only have one parent...
        for (const parent_node of node.parents){
            parent_node.children.delete(node);

            for (const child_node of node.children){
                parent_node.children.add(child_node);
            }
        }

        // Remove the node
        this.vertex_to_node.delete(vert);
    }

    /**
     * Get tree as DOT output for visualization
     */
    get_dot(){

        function node_string(node){
            return `"${node.vertex},${node.value}"`;
        }

        let dot_string = 'digraph G {\n';

        //r1 [style=invis];...rN [style=invis]; r1 -> r2 -> ... -> rN [style=invis];
        let dot_head = '';
        //{rank=same; r1; "v1";}...{rank=same; rN; "vN";}
        let dot_tail = '';

        //NOTE: have to do it this way as it seems it uses the R names somehow in laying things out... so hopefully never get > 100 nodes b/c who knows how r1 vs r100 compare
        //NOTE: wait nvm the issue is you want the definition of the head r1 [style=invis] to be in the same order as the arrows r1->r2->...
        const all_nodes = [];
        this.vertex_to_node.forEach((node) => {
            all_nodes.push(node);
        });

        all_nodes.sort((n1, n2) => n2.value - n1.value);

        for(let i = 0; i < all_nodes.length; i++){
            dot_head += `r${i} [style=invis];\n`; //TODO: can replace instad with the r{node.vertex} if we want and it will be fine b/c this is in the sorted order here
        }
        
        dot_head += "r0";
        dot_tail += `{rank=same; r0; ${node_string(all_nodes[0])};}\n`;
        for(let i = 1; i < all_nodes.length; i++){
            dot_head += ` -> r${i}`;
            dot_tail += `{rank=same; r${i}; ${node_string(all_nodes[i])};}\n`;
        }
        dot_head += " [style=invis];\n";

        let dot_body = '';

        this.vertex_to_node.forEach((node) => {
            // Draw an arrow to each child

            for(const child_node of node.children){
                dot_body += `${node_string(node)} -> ${node_string(child_node)};\n`;
            }
        });

        dot_string += dot_head + dot_body + dot_tail + "}";

        return dot_string
    }
}

/**
 * 
 * @param {ObjMesh} obj_mesh 
 * @param {Array} vert_func 
 * @param {boolean} is_join 
 */
function sweep_algorithm(obj_mesh, vert_func, is_join=true){

    const merge_tree = new Tree();

    // For every component, we want to know the lowest (or highest for join tree) isovalue node so we know what parent
    // to connect to for regular or merge vertex
    const component_boundary_vertex = new Map();

    // 1. Sort vertices

    const sorted_vertices = vert_func.map((_, i) => i);
    sorted_vertices.sort((v1, v2) => vert_func[v1] - vert_func[v2]);

    if(is_join){
        sorted_vertices.reverse();
    }

    // 2. Process sorted vertices
    const ds = new DisjointSet();

    for (const vertex of sorted_vertices){
        ds.make_set(vertex)
        component_boundary_vertex.set(vertex, vertex);

        const components = new Set();

        for(const neighbor of obj_mesh.neighbors(vertex)){
            const neighbor_comp = ds.find(neighbor);

            if (neighbor_comp !== undefined){
                components.add(neighbor_comp);
            }

            //TODO: pass here? see python for potential bug
        }

        if (components.size == 0){
            // Maximum
            // Neighbors aren't components = this is max of neighbors, make new node no parent, all good in ds b/c already made set

            merge_tree.add_node(vertex, vert_func[vertex]);
        }
        else if(components.size == 1){
            // Regular vertex

            for (const comp of components){
                // Get the current boundary vertex for this component
                const comp_boundary_vert = component_boundary_vertex.get(comp);

                // if already exists, that's fine we don't make anything
                merge_tree.add_node(vertex, vert_func[vertex]);
                merge_tree.connect_nodes(comp_boundary_vert, vertex);

                // Make these the same component now in the disjoint set
                ds.union(comp, vertex);
            }

            const merged_comp = ds.find(vertex);
            // This regular vertex is now the lowest isovalue in this component, so make it the new boundary vertex
            component_boundary_vertex.set(merged_comp, vertex);            
        }
        else {
            //TODO: can just merge with previous case b/c they do the same thing really...
            // Saddle

            for (const comp of components){
                // Get the current boundary vertex for this component
                const comp_boundary_vert = component_boundary_vertex.get(comp);

                // if already exists, that's fine we don't make anything
                merge_tree.add_node(vertex, vert_func[vertex]);
                merge_tree.connect_nodes(comp_boundary_vert, vertex);

                // Make these the same component now in the disjoint set
                ds.union(comp, vertex);
            }

            const merged_comp = ds.find(vertex);
            // This regular vertex is now the lowest isovalue in this component, so make it the new boundary vertex
            component_boundary_vertex.set(merged_comp, vertex);
        }
    }

    return merge_tree;
}

function prune_algorithm(superlevelset_merge_tree, sublevelset_merge_tree){

    function is_upper_leaf(vertex){
        return (superlevelset_merge_tree.degree(vertex) == 0);
    }

    function is_lower_leaf(vertex){
        return (sublevelset_merge_tree.degree(vertex) == 0);
    }

    function is_contour_tree_leaf(vertex){
        return ((superlevelset_merge_tree.degree(vertex) == 0) && (sublevelset_merge_tree.degree(vertex) == 1)) || ((sublevelset_merge_tree.degree(vertex) == 0) && (superlevelset_merge_tree.degree(vertex) == 1))
    }

    const leaves = [];
    const contour_tree = new Tree();

    // Add all verts into contour tree; these should be same between Join and Split trees
    superlevelset_merge_tree.vertex_to_node.forEach((node, vertex) => {
        contour_tree.add_node(vertex, node.value);
    });

    // Vertex set of both should be the same
    superlevelset_merge_tree.vertex_to_node.forEach((node, vertex) => {
        if(is_contour_tree_leaf(vertex)){
            leaves.push(vertex);
        }
    });

    while(leaves.length > 0){
        const leaf = leaves.shift();

        if(is_upper_leaf(leaf)){
            // Find edge y_iy_j from Join Tree

            const jt_children = superlevelset_merge_tree.get_children(leaf);
            if(jt_children.size > 1){
                throw new Error(`Should have only had 1 child! ${leaf}: ${jt_children}`)
            }

            if(jt_children.size == 0){
                continue;
            }
            
            // Retrieve single (and only) item with list destructuring assignment
            const [y_j] = jt_children;
            contour_tree.connect_nodes(leaf, y_j.vertex);

            superlevelset_merge_tree.reduce_vert(leaf);
            sublevelset_merge_tree.reduce_vert(leaf);

            // Check if y_j vert is a leaf now
            if(is_contour_tree_leaf(y_j.vertex)){
                leaves.push(y_j.vertex);
            }
        }
        else {
            // Find edge z_iz_j from Split Tree
            
            const st_children = sublevelset_merge_tree.get_children(leaf);
            if(st_children.size > 1){
                throw new Error(`Should have only had 1 child! ${leaf}: ${st_children}`)
            }

            if(st_children.size == 0){
                continue;
            }

            // Retrieve single (and only) item with list destructuring assignment
            const [z_j] = st_children;
            // Here we will add the 'child' as a parent in the contour tree, as split tree is upside down
            contour_tree.connect_nodes(z_j.vertex, leaf);

            superlevelset_merge_tree.reduce_vert(leaf);
            sublevelset_merge_tree.reduce_vert(leaf);

            // Check if z_j vert is a leaf now
            if(is_contour_tree_leaf(z_j.vertex)){
                leaves.push(z_j.vertex);
            }
        }
    }

    return contour_tree;
}

/**
 * 
 * @param {ObjMesh} obj_mesh 
 * @param {Array} vert_func 
 * @returns 
 */
function compute_contour_tree(obj_mesh, vert_func){
    const jt = sweep_algorithm(obj_mesh, vert_func, true)
    const st = sweep_algorithm(obj_mesh, vert_func, false)

    const [jt_sigs, jt_sigroots] = jt.compute_significants()
    const [st_sigs, st_sigroots] = st.compute_significants()

    const merged_sigs = new Set([...jt_sigs, ...st_sigs])

    const jt_sig_tree = jt.gen_sigtree(merged_sigs, jt_sigroots)
    const st_sig_tree = st.gen_sigtree(merged_sigs, st_sigroots)

    const contour_tree = prune_algorithm(jt_sig_tree, st_sig_tree);

    //TODO: contour tree significants only?

    return contour_tree;
}

function ct_test(){
    const terrain = new ObjMesh();
    terrain.parse(terrainstr);
    const heightfunc = terrain.vpos.map(p => p[2]*4);

    const jt = sweep_algorithm(terrain, heightfunc, true)
    const st = sweep_algorithm(terrain, heightfunc, false)

    const [jt_sigs, jt_sigroots] = jt.compute_significants()
    const [st_sigs, st_sigroots] = st.compute_significants()

    const merged_sigs = new Set([...jt_sigs, ...st_sigs])

    const jt_sig_tree = jt.gen_sigtree(merged_sigs, jt_sigroots)
    const st_sig_tree = st.gen_sigtree(merged_sigs, st_sigroots)

    const contour_tree = prune_algorithm(jt_sig_tree, st_sig_tree);

    console.log(contour_tree)

    console.log(contour_tree.get_dot())
}