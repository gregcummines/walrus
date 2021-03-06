import * as jwt from 'jsonwebtoken';
import { WalrusRepository } from '../../repository/walrus';
import { User } from '../../interfaces/user';
import * as bcrypt from 'bcrypt';
import { Role } from '../../interfaces/role';
import UserAlreadyExistsException from '../../exceptions/internal/UserAlreadyExistsException';
export class UsersService {

    public authenticate({ username, password }): User {
        const walrusRepository = new WalrusRepository();
        const user = walrusRepository.getUser(username);
        // If the user is not found or the password is incorrect
        if (!user ||
            !bcrypt.compareSync(password, user.password) ) {
                throw 'Username or password is incorrect';
        }
        
        // If the user is active, create an auth token
        if (user.active) {
            // create a jwt token that is valid for 7 days
            const token = jwt.sign({ id: user.id }, process.env["WALRUS_JWT_SECRET_KEY"], { expiresIn: '30d' });
            user.token = token;
        }
        return user;
    }

    public register({ firstName, lastName, username, password }): User {
        const walrusRepository = new WalrusRepository();
        const existingUser = walrusRepository.getUser(username);
        if (existingUser) {
            throw new UserAlreadyExistsException();
        } 

        const passwordHash = bcrypt.hashSync(password, 10);
        const user = walrusRepository.addUser(
                firstName, 
                lastName, 
                username, 
                passwordHash
            );

        if (user.role === Role.Admin) {
            const token = jwt.sign({ id: user.id }, process.env["WALRUS_JWT_SECRET_KEY"], { expiresIn: '30d' });
            user.token = token;
        }
        return user;
    }

    public getAll(): User[] {
        const walrusRepository = new WalrusRepository();
        return walrusRepository.getUsers();
    }

    public deleteUserById(id: number): void {
        const walrusRepository = new WalrusRepository();
        walrusRepository.deleteUserById(id);
    }

    public activateUserById(id: number): void {
        const walrusRepository = new WalrusRepository();
        walrusRepository.activateUserById(id);
    }

    public deactivateUserById(id: number): void {
        const walrusRepository = new WalrusRepository();
        walrusRepository.deactivateUserById(id);
    }
}