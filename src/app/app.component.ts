import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { EMPTY, from, fromEvent, Subject, Subscription } from 'rxjs';
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
share,
takeUntil,
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

  private stop$ = new Subject<void>();

  constructor(private dataService: DataService) {}

  ngAfterViewInit() {
    fromEvent(this.button.nativeElement, 'click')
      .pipe(
        throttleTime(3000),
        tap(() => this.cleanUp()),
        switchMap(() => this.dataService.getPosts()),
        switchMap((posts: Post[]) =>
          from(posts).pipe(
            concatMap((post: Post) =>
              this.dataService.getUser(post.userId).pipe(
                map((user: User) => {
                  return { post: post, user: user };
                })
              )
            )
          )
        ),
        takeUntil(this.stop$)
      )
      .subscribe((postWithUser) => {
        this.postsWithUsers.push(postWithUser);
      });

    fromEvent(this.input.nativeElement, 'input')
      .pipe(
        debounceTime(500),
        pluck('target', 'value'),
        distinctUntilChanged(),
        tap(() => this.cleanUp()),
        tap((id: number) => {
          if (!this.isValidId(id))
            this.error = 'Error: Please enter a valid id between 1 and 100!';
        }),
        filter((id: number) => this.isValidId(id)),
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
        }),
        takeUntil(this.stop$)
      )
      .subscribe({
        next: (postWithUser) => {
          this.postsWithUsers.push(postWithUser);
        },
        error: (error) => {
          this.error = error.message;
        },
      });
  }

  ngOnDestroy() {
    this.stop$.next();
    this.stop$.complete();
  }

  private cleanUp() {
    this.postsWithUsers = [];
    this.error = '';
  }

  private isValidId(id: number): boolean {
    return id > 0 && id <= 100;
  }
}
