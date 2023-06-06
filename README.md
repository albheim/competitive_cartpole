# Competitive cartpole balancing
This is a simple implementation of a simulated cartpole in javascript where the user battles an LQR controller.

### Play
Try the game [here](https://albheim.github.io/competitive_cartpole/)

The challenge is to keep the pole upright, and keep close to the target x-coordinate.
The further away from the target, the lower score you get each step. 

### LQR synthesis
The LQR controller is synthesized using [ModelingToolkit.jl](https://github.com/SciML/ModelingToolkit.jl) for implementing and linearizing the model, and [ControlSystems.jl](https://github.com/JuliaControl/ControlSystems.jl) to solve the Riccati equation.
To run the script, install Julia and add the Pluto.jl package. Run Pluto and open the notebook `src/lqr_tuning.jl`, it might take a while the first time since it installs and precompiles the dependencies.
