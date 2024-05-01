**Victor Petrov**
**CS6170**

Computes contour tree based on algorithm in [Computing contour trees in all dimensions](https://doi.org/10.1016/S0925-7721(02)00093-7) from Harr et al.

WebGL code adapted from [Cem Yuksel](https://graphics.cs.utah.edu/courses/cs4600/fall2023/)

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
