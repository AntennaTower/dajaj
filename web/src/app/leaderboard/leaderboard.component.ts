import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { filter, Observable, switchMap, take, tap } from 'rxjs';
import { PlayerStatsDto } from './leaderboard.model';
import { LeaderboardService } from './leaderboard.service';
import { VisualizationsComponent } from './visualizations/visualizations.component';
import {
  Visualization,
  visualizations,
} from './visualizations/visualiztions.model';

@Component({
  template: `
    <div>
      <div class="config__container">
        <mat-form-field>
          <mat-label>Visualization</mat-label>
          <mat-select [formControl]="visualiztion">
            @for (visualiztion of visualizations; track visualiztion) {
            <mat-option [value]="visualiztion">{{ visualiztion }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <div class="config__username-select">
          <mat-form-field>
            <mat-label>Usernames</mat-label>
            <mat-select [formControl]="usernames" multiple>
              @for (username of $validUsernames(); track username) {
              <mat-option [value]="username">{{ username }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-icon-button (click)="onRefresh()">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>
      <app-visualizations
        [visualization]="visualiztion.value!"
        [playerStats]="$playerStats()"
      ></app-visualizations>
    </div>
  `,
  styles: `
    .config__username-select {
      display: flex;
      justify-content: start;
      align-items: center;
    }
  `,
  imports: [
    VisualizationsComponent,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatIcon,
    MatIconButton,
  ],
  providers: [LeaderboardService],
  selector: 'app-leaderboard',
  standalone: true,
})
export class LeaderboardComponent {
  private readonly leaderboardService = inject(LeaderboardService);
  protected readonly visualizations = visualizations;
  protected readonly $playerStats = signal<PlayerStatsDto[]>([]);
  protected readonly $validUsernames = toSignal(
    this.leaderboardService
      .getValidPlayers$()
      .pipe(tap((usernames) => this.usernames.setValue(usernames))),
  );

  protected readonly usernames = new FormControl<string[]>([]);
  protected readonly visualiztion = new FormControl<Visualization>('Table', {
    validators: [Validators.required],
  });

  constructor() {
    this.usernames.valueChanges
      .pipe(
        filter((usernames) => !!usernames),
        switchMap((usernames) => this.getPlayerStats$(usernames, false)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected onRefresh(): void {
    this.getPlayerStats$(this.usernames.value ?? [], true).subscribe();
  }

  protected getPlayerStats$(
    usernames: string[],
    doRefresh = false,
  ): Observable<PlayerStatsDto[]> {
    return this.leaderboardService.getLeaderboard$(usernames, doRefresh).pipe(
      tap((playerStats) => this.$playerStats.set(playerStats)),
      take(1),
    );
  }
}
