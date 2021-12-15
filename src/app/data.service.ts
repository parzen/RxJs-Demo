import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Post } from './post.interface';
import { User } from './user.interface';

const API_URL = 'https://jsonplaceholder.typicode.com';

@Injectable({providedIn: 'root'})
export class DataService {
  constructor(private http: HttpClient) {}

  getPosts() {
    return this.http.get<Post[]>(API_URL + '/posts').pipe(
      map((posts) => {
        return posts.map((post: Post) => {
          return {
            userId: post.userId,
            id: post.id,
            title: post.title,
            body: post.body,
          };
        });
      })
    );
  }

  getPost(id: string) {
    return this.http.get<Post>(API_URL + `/posts/${id}`);
  }

  getUsers() {
    return this.http.get<User[]>(API_URL + '/users');
  }

  getUser(id: string) {
    return this.http.get<User>(API_URL + `/users/${id}`)
  }
}
