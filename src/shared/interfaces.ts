// sqlite: Lists ; firebase: lists
export interface List {        //list
    key: string;
    name: string;
    dateCreated: string;
    user: User;
    items: number;
    comments: number;
    shares: number;
    users: Array<any>;
}

// sqlite: ListItems ; firebase: items
export interface ListItem {
    key?: string;
    list: string;
    user: User;
    text: string;
    qt: number;
    category: string;
    state: number;
    dateCreated: string;
}

// sqlite: ListComments ; firebase: comments
export interface ListComment {
    key?: string;
    list: string;
    text: string;
    user: User;
    dateCreated: string;
    votesUp: number;
    votesDown: number;
}

// sqlite: Users ; firebase: users
export interface User {
    uid: string;
    username: string;
}

export interface UserCredentials {
    email: string;
    password: string;
}

export interface UserProfile {
    uid: string;
    username: string;
    email: string;
    dateOfBirth: string;
    image?: boolean;
    photoURL?: string;
    friendship?: string;
    photo: boolean;
}

export interface Predicate<T> {
    (item: T): boolean;
}

export interface ValidationResult {
    [key: string]: boolean;
}