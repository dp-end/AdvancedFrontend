import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerProductsComponentComponent } from './seller-products-component.component';

describe('SellerProductsComponentComponent', () => {
  let component: SellerProductsComponentComponent;
  let fixture: ComponentFixture<SellerProductsComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerProductsComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerProductsComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
