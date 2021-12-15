import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { mergeMap, throttleTime, switchMap, tap, map } from 'rxjs/operators';
import { DataService } from './data.service';
import { Post } from './post.interface';
import { User } from './user.interface';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('button') button: ElementRef;

  postsWithUser: Array<Post>;
  private buttonSub: Subscription;

  constructor(private dataService: DataService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.buttonSub = fromEvent(this.button.nativeElement, 'click')
      .pipe(
        throttleTime(3000),
        tap(() => console.log('Trigger getPosts()')),
        switchMap(() => {
          return this.dataService.getPosts()
        }),
        mergeMap((posts) => {
          console.log(posts);
          return this.dataService.getPosts();
        })
      )
      .subscribe((data) => {
          this.postsWithUser = data;
        });
  }

  ngOnDestroy() {
    this.buttonSub.unsubscribe();
  }
}

// Nur rxjs Observables verwenden (button, input)

// Wenn user clickt Button -> get https://jsonplaceholder.typicode.com/posts
// -> Return posts und zusätzlich User Object über https://jsonplaceholder.typicode.com/users/${userId}

// Bonus:
// Wenn user in Input field eine Id eingibt, dann wird nur der eine Posts angezeigt https://jsonplaceholder.typicode.com/posts/${postId}
