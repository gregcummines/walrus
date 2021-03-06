import * as express from 'express';
import authMiddleware from '../../middleware/auth.middleware';
import Controller from '../../interfaces/controller.interface';
import { UsersService } from './users.service';
import UserAlreadyExistsException from '../../exceptions/internal/UserAlreadyExistsException';
export class UsersController implements Controller {
    private usersService: UsersService = new UsersService();
    
    public path = '/users';
    public router = express.Router();

    constructor() {
      this.intializeRoutes();
    }
   
    public intializeRoutes() {
      this.router.get(this.path, authMiddleware, this.getAll);
      this.router.post(`${this.path}/register`, this.register);
      this.router.post(`${this.path}/authenticate`, this.authenticate);
      this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteUser);
      this.router.post(`${this.path}/activate/:id`, authMiddleware, this.activateUser);
      this.router.post(`${this.path}/deactivate/:id`, authMiddleware, this.deactivateUser);
    }

    getAll = (request: express.Request, 
            response: express.Response, 
            next: express.NextFunction) => {
      const users = this.usersService.getAll();  
      response.send(users);
    } 

    register = (request: express.Request, 
              response: express.Response, 
              next: express.NextFunction) => {
      let userWithToken = null;
      try {
        userWithToken = this.usersService.register(request.body);
        response.send(userWithToken);   
      } catch(error) {
        if (error instanceof UserAlreadyExistsException) {
          response.status(409).send('User already exists');
        } else {
          console.log(error);
          response.status(401).send('Invalid login credentials');
        }
      }
    }

    authenticate = (request: express.Request, 
                    response: express.Response, 
                    next: express.NextFunction) => {
      let userWithToken = null;
      try {
        userWithToken = this.usersService.authenticate(request.body);
        if (userWithToken.token) {
          response.send(userWithToken);
        } else {
          response.status(401).send('Account not activated');
        } 
      } catch(error) {
        response.status(401).send('Invalid login credentials');
      }
    }
    
    activateUser = (request: express.Request, 
                    response: express.Response, 
                    next: express.NextFunction) => {
      let userWithToken = null;
      try {
        this.usersService.activateUserById(+request.params.id);
        response.status(200).send();
      } catch(error) {
        response.status(401).send('Invalid login credentials');
      } 
    }

    deactivateUser = (request: express.Request, 
                    response: express.Response, 
                    next: express.NextFunction) => {
      let userWithToken = null;
      try {
        this.usersService.deactivateUserById(+request.params.id);
        response.status(200).send(); 
      } catch(error) {
        response.status(401).send('Invalid login credentials');
      }
      
    }

    deleteUser = (request: express.Request, 
                  response: express.Response, 
                  next: express.NextFunction) => {
      let userWithToken = null;
      try {
        this.usersService.deleteUserById(+request.params.id);
        response.status(200).send();
      } catch(error) {
        response.status(401).send('Invalid login credentials');
      }  
    }
}  