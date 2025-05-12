import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SepetPageComponent } from './sepet-page.component';

describe('SepetPageComponent', () => {
  let component: SepetPageComponent;
  let fixture: ComponentFixture<SepetPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SepetPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SepetPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
