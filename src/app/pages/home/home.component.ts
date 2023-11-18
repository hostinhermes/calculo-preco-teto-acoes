import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppTheme, ThemeService } from '@lib/services/theme';
import { Subject, takeUntil } from 'rxjs';


@Component({
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
    currentTheme!: AppTheme | null;

    private readonly _themeService = inject(ThemeService);

    private readonly _destroy$ = new Subject();

    tickersDividendHistory: any[] = []
    tickers = ["BBAS3","TRPL4", "TAEE4", "TAEE11", "BBSE3"]


    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this._themeService.currentTheme$
            .pipe(takeUntil(this._destroy$))
            .subscribe((theme) => (this.currentTheme = theme));
        this.getTickersInfo();
       

        
    }

    async getTickersInfo() {
        this.tickers.forEach((ticker) => {

            this.http.get<any>(`http://localhost:4200/api/acao/companytickerprovents?ticker=${ticker}&chartProventsType=2`).subscribe(data => {
                console.log(ticker);
                console.log(data);
                this.calculePrice(data);
                this.setActualValue(data, ticker)
                this.tickersDividendHistory.push({ ticker: ticker, history: data });
            });
        });
    }
    setActualValue(data: any, ticker: string) {
        this.http.get<any>(`http://localhost:4200/apihome/mainsearchquery?q=${ticker}`).subscribe(response => {
                console.log(ticker);
                console.log(response);
                data.actualPrice = response[0].price
            });
    }

    calculePrice(data: any) {
        let totalValue = 0
        console.log(new Date().getFullYear())
        console.log(new Date().getFullYear() - 6)
        const years = data.assetEarningsYearlyModels
        .filter((year:any) => (year.rank < new Date().getFullYear() && year.rank >= (new Date().getFullYear() - 6)))
        years.forEach((year: any) => {
            console.log(year.rank + ":" + year.value)
            totalValue += year.value
        })
        console.log(totalValue)
        console.log(years.length)
        const averageDividendValue = totalValue / (years.length)
        console.log(averageDividendValue)
        const price = averageDividendValue / 0.06
        data.price = price
  
    }

    ngOnDestroy(): void {
        this._destroy$.complete();
        this._destroy$.unsubscribe();
    }

    handleThemeChange(theme: AppTheme): void {
        this._themeService.setTheme(theme);
    }
}
