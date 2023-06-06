# Competitive cartpole balancing
This is a simple implementation of a cartpole in javascript, where the user can compete agains an LQR controller.

The LQR controller is synthesized using [ModelingToolkit.jl]() for implementing and linearizing the model, and [ControlSystems.jl]() to solve the Riccati equation.

The challenge is to keep the pole upright, and keep close to the target x-coordinate.
A penalty is given for the distance to the target.