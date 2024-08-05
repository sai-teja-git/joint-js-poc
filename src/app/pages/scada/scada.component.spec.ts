import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScadaComponent } from './scada.component';

describe('ScadaComponent', () => {
  let component: ScadaComponent;
  let fixture: ComponentFixture<ScadaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScadaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScadaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
