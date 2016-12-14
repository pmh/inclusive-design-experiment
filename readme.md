# About

An experimental (very early stages) web application architecture with the following goals

- Content should always be accessible even without both javascript and css
- Application logic should run on isolated threads (workers) that produces descriptions of dom manipulations which are then applied to the real dom as a batch during requestAnimationFrame
- It should be small, fast and memory efficient
- Code written in this style should be pure and free of side effects
- It should promote inclusive "best" practices

# Run

> git clone https://github.com/pmh/inclusive-design-experiment.git
> npm i
> npm start
