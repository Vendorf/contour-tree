**Victor Petrov**
**CS6170**

Computes contour tree based on algorithm in [Computing contour trees in all dimensions](https://doi.org/10.1016/S0925-7721(02)00093-7) from Harr et al.

_WebGL code adapted from [Cem Yuksel](https://graphics.cs.utah.edu/courses/cs4600/fall2023/)._

The contour tree is displayed in a popup window, so allow popups for the site and reload to allow it to work.

# Overview 

Note the contour tree is only guaranteed to work on simply connected surfaces - that is, any cycle on the surface can be collapsed to a point (IE, there are no holes). Surfaces with holes will give incorrect results in the hole intersects the isocurve of the function. For non-simply connected surfaces, you must use a Reeb graph algorithm.

TODO

# Install

1. `npm init (if no package.json, will create)`
2. `npm i (will install everything in package.json)`
    - `npm i @viz-js`
    - `npm i plain-draggable`
    - `npm i leader-line`
    - `npm i vite`
3. `plain-draggable` needs some extra work
    - `cd node_modules/plain-draggable`
    - `npm i --force`

# Run
1. `npx vite`
    - Will install `vite` if missing
2. Don't forget to allow popups for the contour tree window to show up

# GitHub.io
Hosted on [https://vendorf.github.io/contour-tree/](https://vendorf.github.io/contour-tree/).

Built with `npx vite build` and the `dist` folder is renamed to `docs` to allow GitHub Pages to pick it up automatically.
- Nvm this doesn't work need to fix properly with GitHub Actions
