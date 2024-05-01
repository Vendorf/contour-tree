import { instance } from "@viz-js/viz";
import PlainDraggable from "plain-draggable"

const draggableIsoBar = new PlainDraggable(document.getElementById('draggable'));
var iso_min = 0;
var iso_max = 1;

const graphContainer = document.getElementById("graph-container");
const boxDiv = document.getElementById("box");
const leader_lines = [];
var leader_line_type = 'magnet';

var proportional_render = true;

document.getElementById("straightRadio").onchange = () => {
    leader_line_type = 'straight';

    for(const line of leader_lines){
        line.setOptions({path: leader_line_type});
    }
}
document.getElementById("magnetRadio").onchange = () => {
    leader_line_type = 'magnet';

    for(const line of leader_lines){
        line.setOptions({path: leader_line_type});
    }
}

document.getElementById("proportionalCheckbox").onchange = (event) => {
    set_proportional_render(event.currentTarget.checked);
}

// new LeaderLine(
//     document.getElementById('node2'),
//     document.getElementById('node1')
//   );

draggableIsoBar.onMove = function(newPosition) {
    // console.log('left: %d top: %d width: %d height: %d it is scrolling: %s',
    //   // determined position that was changed by snap and onDrag
    //   newPosition.left, newPosition.top,
    //   this.rect.width, this.rect.height,
    //   newPosition.autoScroll);

    if(window.change_isovalue){
        // window.change_isovalue(new_value);
        const rect = boxDiv.getBoundingClientRect();
        const percentDown = (newPosition.top + this.rect.height / 2) / rect.height;

        const iso_extent = iso_max - iso_min;

        const isoval = iso_max - percentDown * (iso_extent)

        window.change_isovalue(isoval);
    }
  };

// const graphDiv = document.getElementById("box");


var curr_raw = undefined;
function process_raw(raw_out){
    curr_raw = raw_out;

    const lines = raw_out.split("\n");
    // Find all non-r nodes and edges
    const nodes = lines.filter((line) => line.startsWith("node") && !line.startsWith("node r"));
    const edges = lines.filter((line) => line.startsWith("edge") && !line.startsWith("edge r"));
    // console.log(nodes)
    // console.log(edges)

    const xs = [];
    const vals = []
    const names = [];
    for(const node of nodes){
        const node_parts = node.split(" ");
        //node name x y width height label style shape color fillcolor
        //node a 1.375 6.25 0.75 0.5 a solid ellipse black lightgrey
        const name = node_parts[1];
        const x = node_parts[2];
        const y = node_parts[3];
        // const w = node_parts[4];
        // const h = node_parts[5];

        xs.push(Number(x));
        //TODO: alternative mode where use y's as scaling instead
        // (just make it add y's into vals[] instead of actual values)
        // just make sure to change how we compute the isovalue then...not sure how it would work
        if(proportional_render){
            vals.push(Number(name.substring(name.indexOf(',')+1, name.length-1)));
        } else {
            vals.push(Number(y));
        }
        names.push(name);

        // console.log(name)
    }

    // console.log(xs, vals);

    let min_x = Math.min(...xs)
    let max_x = Math.max(...xs)
    
    let min_val = Math.min(...vals);
    let max_val = Math.max(...vals);

    // iso_min = min_val;
    // iso_max = max_val;

    // console.log(min_x, max_x, min_val, max_val)

    let extent_x = max_x - min_x;
    let extent_vals = max_val - min_val;

    // Pad the extents a bit
    min_x -= 0.05 * extent_x;
    max_x += 0.05 * extent_x;
    min_val -= 0.05 * extent_vals;
    max_val += 0.05 * extent_vals;
    extent_x = max_x - min_x;
    extent_vals = max_val - min_val;

    iso_min = min_val;
    iso_max = max_val;


    // console.log(extent_x, extent_vals, lines[0]);

    // Compute x percent for each node
    const x_percents = Array(xs.length);
    if(extent_x == 0){
        // Just fill with 50% everywhere
        x_percents.fill(50);
    }
    else {
        for(let i = 0; i < xs.length; i++){
            // OR with 0 makes it into an int b/c JS is dumb
            x_percents[i] = (100 * ((xs[i] - min_x) / (extent_x))) | 0;
        }
    }

    // Compute y percent for each node from value
    const y_percents = Array(vals.length);
    if(extent_vals == 0){
        // Just fill with 50% everywhere
        y_percents.fill(0.5);
    } else {
        for(let i = 0; i < vals.length; i++){
            // OR with 0 makes it into an int b/c JS is dumb
            // Reversed b/c want maximum value to be 0%
            y_percents[i] = (100 * ((max_val - vals[i]) / (extent_vals))) | 0;
        }
    }

    // console.log(x_percents, y_percents)
    //edge tail head n x₁ y₁ .. xₙ yₙ [label xl yl] style color
    //graph scale width height

    //TODO: now just make the actual DOM nodes directly and place them where they need to go
    // as do so, store name --> dom node map
    // then can go through edges, grab the two names, and create a leaderline between the two dom nodes

    // Remove before end up clearing the nodes
    for(const line of leader_lines){
        line.remove();
    }
    // This is valid JS lmao
    leader_lines.length = 0;

    //TODO: maybe remove all children first so don't get multiple with same id

    // const node_map = new Map();
    const new_children = [];
    for(let i = 0; i < x_percents.length; i++){
        const node_div = document.createElement("div");
        node_div.style.position = 'absolute';
        node_div.style.top = y_percents[i] + '%';
        node_div.style.left = x_percents[i] + '%';
        // node_div.style.top = '100px';
        // node_div.style.left = '100px';
        node_div.style.width = '20px';
        node_div.style.height = '20px';
        node_div.style.backgroundColor = 'purple';
        node_div.style.borderRadius = '100%';
        // node_div.style.borderColor = 'transparent';
        // node_div.style.backgroundClip = 'content-box';

        node_div.id = names[i];
        new_children.push(node_div);

        // node_map.set(names[i], node_div);
    }

    graphContainer.replaceChildren(...new_children);

    // console.log(leader_lines);
    // Make leaderlines

    for(const edge of edges){
        const edge_parts = edge.split(" ");

        const n1 = edge_parts[1];
        const n2 = edge_parts[2];

        const line = new LeaderLine(
            document.getElementById(n1),
            document.getElementById(n2),
            {startSocket: 'bottom', endSocket: 'top', path: leader_line_type, endPlug: 'behind'}
        );

        leader_lines.push(line);
    }

}

function set_proportional_render(prop){
    proportional_render = prop;
    process_raw(curr_raw);
}

function render_dot(tree_dot){
    console.log('rendering in poup');

    instance().then(viz => {
        // const svg = viz.renderSVGElement(tree_dot);
        // graphDiv.replaceChildren(svg);

        const render_raw = viz.renderString(tree_dot, {format: "plain"});
        process_raw(render_raw);
    })
}

window.render_dot = render_dot;

// // Try generating
// document.getElementById("gen_btn").onclick = () => {
//     const dot = `digraph G {
//         r1 [style=invis];
//         r2 [style=invis];
//         r3 [style=invis];
//         r4 [style=invis];
//         r5 [style=invis];
//         r6 [style=invis];
//         r7 [style=invis];
//         a -> d;
//         b -> c;
//         c -> d;
//         d -> e;
//         e -> f;
//         e -> g;
//         r1 -> r2 -> r3 -> r4 -> r5 -> r6 -> r7 [style=invis];
        
//         {rank=same; r1; a;}
//         {rank=same; r2; b;}
//         {rank=same; r3; c;}
//         {rank=same; r4; d;}
//         {rank=same; r5; e;}
//         {rank=same; r6; f;}
//         {rank=same; r7; g;}
//         }`
    
//     console.time("timer")
//     instance().then(viz => 
//         {
//             // const svg = viz.renderSVGElement(huge);
//             const svg = viz.renderSVGElement(dot);
//             const render_raw = viz.renderString(dot, {format: "plain"});
//             document.getElementById("graph").appendChild(svg);
//             console.log(render_raw);
//             // document.getElementById("raw").textContent = (render_raw);
//             console.timeEnd("timer")

//             // process raw
//             process_raw(render_raw);
//         })
// }