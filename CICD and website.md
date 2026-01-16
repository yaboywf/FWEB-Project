# CI/CD Process

This web application is deployed using a simple continuous deployment workflow to ensure that updates can be published efficiently and consistently.

The source code is stored in a Git repository. Whenever changes are made, the developer commits and pushes the updated code to the repository. Once a push is detected, the hosting platform Render automatically pulls the latest version of the code, runs the build process, and deploys the updated application online.

This setup allows the application to be:
- Easily updated without manual deployment steps
- Consistently built in the same environment each time
- Publicly accessible through a live URL

Although the current workflow does not include automated testing or checks, it still demonstrates the core principles of CI/CD and GitOps, where deployment is driven directly by version control changes. This approach ensures that the live application always reflects the latest committed code and fulfills the deployment requirement of the project.

# Website Link
https://teach-and-tackle.onrender.com

# Git Repository
https://github.com/yaboywf/FWEB-Project

# Other Notes
- On the free tier web service, Render stops (spins down) your app if it hasn’t had traffic for about 15 minutes.
- Up to 1 minute for service to start and spin up
- Deployment time is no more than 10 minutes