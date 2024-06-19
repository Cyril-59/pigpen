import {Component, ElementRef, ViewChild} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FormsModule} from "@angular/forms";
import {JsonPipe, NgClass} from "@angular/common";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, NgClass, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'pigpen';
  lettres = '';
  chiffres = '';
  notShifted = ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  array: string[] = [];
  doubleArray: string[][] = [];
  positions = new Map<number, string[]>([
    [2, ["2", "11"]],
    [3, ["3", "12", "21", "111"]],
    [4, ["4", "22", "13", "31", "121", "211", "112", "1111"]],
    [5, ["5", "32", "23", "41", "14", "311", "131", "113", "221", "212", "122", "2111", "1211", "1121", "1112", "11111"]]
  ]);
  coins = new Map<string, number[]>([
    ['A', [1, 3, 4]], ['B', [1, 2, 3, 4]], ['C', [2, 3, 4]], ['D', [1, 2, 3, 4]], ['E', [1, 2, 3, 4]], ['F', [1, 2, 3, 4]],
    ['G', [1, 2, 3]], ['H', [1, 2, 3, 4]], ['I', [1, 2, 4]], ['J', [1, 3, 4]], ['K', [1, 2, 3, 4]], ['L', [2, 3, 4]],
    ['M', [1, 2, 3, 4]], ['N', [1, 2, 3, 4]], ['O', [1, 2, 3, 4]], ['P', [1, 2, 3]], ['Q', [1, 2, 3, 4]], ['R', [1, 2, 4]],
    ['S', [3, 4]], ['T', [2, 4]], ['U', [1, 2]], ['V', [1, 3]], ['W', [3, 4]], ['X', [2, 4]], ['Y', [1, 2]], ['Z', [1, 3]]
  ]);
  @ViewChild("scroll") private scrollDiv!: ElementRef;

  fillArray() {
    this.array.length = 0;
    let cpt = 0;
    for (let i of this.chiffres.split('')) {
      this.array.push(this.lettres.substring(cpt, cpt + parseInt(i)));
      cpt += parseInt(i);
    }
  }

  generate() {
    if (this.lettres.length > 1 && this.lettres.length < 6 ) {
      this.doubleArray.length = 0;
      let word = this.lettres;
      for (let i = 0; i < this.lettres.length; i++) {
        this.generateForWord(word);
        const first = word.charAt(0);
        word = word.substring(1) + first;
      }
      setTimeout(() => {
        this.scrollDiv.nativeElement.scrollIntoView({ behavior: "smooth", block: "start" });
      })
    }
  }

  private generateForWord(letters: string) {
    for (let position of this.positions.get(letters.length)!) {
      let localArray = [];
      let cpt = 0;
      for (let i of position.split('')) {
        localArray.push(letters.substring(cpt, cpt + parseInt(i)));
        cpt += parseInt(i);
      }
      this.doubleArray.push(localArray);
    }
  }

  delete(index: number, element: any) {
    element.style.opacity = '0';
    setTimeout(() => {
      this.doubleArray.splice(index, 1);
    }, 500)
  }
}
