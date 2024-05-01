/**
 * Various functions over the vertices 
 * 
 */

/**
 * 
 * @param {MassSpring} ms 
 */
function height_function(ms){
    const height_func = ms.pos.map((p) => p.y);

    const max_height = Math.max(...height_func);
    const min_height = Math.min(...height_func);

    //TODO: can scale these between 0 and 1 based on this here; or just leave that for the vertex/frag shader to do with max/min passed as unifs

    return [height_func, max_height, min_height]
}

/**
 * 
 * @param {Array} positions 
 * @param {Vec3} target 
 */
function distance(positions, target){
    //TODO
    // distance from a point as the height function
}