import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { EMPTY, from, fromEvent, Subscription } from 'rxjs';
import {
  throttleTime,
  switchMap,
  tap,
  map,
  debounceTime,
  pluck,
  distinctUntilChanged,
  filter,
  concatMap,
} from 'rxjs/operators';
import { DataService } from './data.service';
import { Post } from './post.interface';
import { User } from './user.interface';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('button') button: ElementRef;
  @ViewChild('input') input: ElementRef;

  postsWithUsers: Array<{ post: Post; user: User }> = [];
  error: string = '';

  private inputSub: Subscription;
  private buttonSub: Subscription;

  constructor(private dataService: DataService) {}

  ngAfterViewInit() {
    this.buttonSub = fromEvent(this.button.nativeElement, 'click')
      .pipe(
        throttleTime(3000),
        tap(() => this.empty()),
        switchMap(() => this.dataService.getPosts()),
        concatMap((posts: Post[]) =>
          from(posts).pipe(
            concatMap((post: Post) =>
              this.dataService.getUser(post.userId).pipe(
                map((user: User) => {
                  return { post: post, user: user };
                })
              )
            )
          )
        )
      )
      .subscribe((postWithUser) => {
        this.postsWithUsers.push(postWithUser);
      });

    this.inputSub = fromEvent(this.input.nativeElement, 'input')
      .pipe(
        debounceTime(500),
        pluck('target', 'value'),
        distinctUntilChanged(),
        tap(() => this.empty()),
        tap((id: number) => {
          if (!this.validIds(id))
            this.error = 'Error: Please enter a valid id between 0 and 99!';
        }),
        filter((id: number) => this.validIds(id)),
        switchMap((id: number) => {
          return id
            ? this.dataService.getPost(id.toString()).pipe(
                switchMap((post: Post) =>
                  this.dataService.getUser(post.userId).pipe(
                    map((user: User) => {
                      return { post: post, user: user };
                    })
                  )
                )
              )
            : EMPTY;
        })
      )
      .subscribe({
        next: (postWithUser) => {
          console.log(postWithUser);
          this.postsWithUsers.push(postWithUser);
        },
        error: (error) => {
          this.error = error.message;
        },
      });
  }

  ngOnDestroy() {
    this.buttonSub.unsubscribe();
    this.inputSub.unsubscribe();
  }

  private empty() {
    this.postsWithUsers = [];
    this.error = '';
  }

  private validIds(id: number): boolean {
    return id >= 0 && id < 100;
  }
}
