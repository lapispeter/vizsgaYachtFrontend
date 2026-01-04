import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

type Yacht = {
  id: number;
  name: string;
  builder: string;
  length: number;
  guests: number;
  cabins: number;
  crew: number;
  daily_price: number;
  deposit: number;
  image: string;
};

type CreateBerlesRequest = {
  uid: number;
  yachtId: number;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  dailyPrice: number;
  deposit: number;
};

@Component({
  selector: 'app-charter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './charter.html',
  styleUrl: './charter.css'
})
export class Charter {
  yachts: Yacht[] = [];
  filtered: Yacht[] = [];
  search = '';
  loading = false;
  error = '';

  // ✅ Backend + Firebase
  private firebaseUrl = 'https://p161-7ddfd-default-rtdb.europe-west1.firebasedatabase.app/yachts.json';
  private backendUrl = 'http://localhost:8000/api/berlesek';

  // ✅ Üzenetek
  toast = { show: false, type: 'success' as 'success' | 'danger', message: '' };

  // ✅ Modal állapot
  showModal = false;
  selected: Yacht | null = null;

  // ✅ Űrlap (vizsga szerint: tetszőleges uid, pl. 101)
  form = {
    uid: 101,
    startDate: '',
    endDate: ''
  };

  submitting = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadYachts();
  }

  loadYachts() {
    this.loading = true;
    this.error = '';

    this.http.get<Yacht[]>(this.firebaseUrl).subscribe({
      next: (data) => {
        this.yachts = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load yachts.';
        this.loading = false;
      }
    });
  }

  applyFilter() {
    const q = this.search.trim().toLowerCase();
    if (!q) {
      this.filtered = [...this.yachts];
      return;
    }

    this.filtered = this.yachts.filter(y =>
      (y.name ?? '').toLowerCase().includes(q) ||
      (y.builder ?? '').toLowerCase().includes(q)
    );
  }

  // ===== Modal vezérlés =====
  openRent(y: Yacht) {
    this.selected = y;
    this.showModal = true;

    // ürítjük a dátumokat (uid maradhat)
    this.form.startDate = '';
    this.form.endDate = '';
  }

  closeRent() {
    this.showModal = false;
    this.selected = null;
    this.submitting = false;
  }

  // ===== Toast =====
  showToast(type: 'success' | 'danger', message: string) {
    this.toast = { show: true, type, message };
    setTimeout(() => (this.toast.show = false), 3500);
  }

  // ===== POST bérlés =====
  submitRent() {
    if (!this.selected) return;

    // minimál kliens oldali check (backend úgyis validál)
    if (!this.form.startDate || !this.form.endDate) {
      this.showToast('danger', 'Please choose start and end dates.');
      return;
    }

    const payload: CreateBerlesRequest = {
      uid: Number(this.form.uid),
      yachtId: Number(this.selected.id),
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      dailyPrice: Number(this.selected.daily_price),
      deposit: Number(this.selected.deposit)
    };

    this.submitting = true;

    this.http.post(this.backendUrl, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.closeRent();
        this.showToast('success', 'Booking created successfully! ✅');
      },
      error: (err) => {
        this.submitting = false;

        // backend 400 üzenet kiolvasása
        const msg =
          err?.error?.message ||
          err?.error ||
          'Booking failed. Please check the dates and try again.';

        this.showToast('danger', msg);
      }
    });
  }
}
