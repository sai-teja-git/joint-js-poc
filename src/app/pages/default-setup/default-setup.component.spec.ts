import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultSetupComponent } from './default-setup.component';

describe('DefaultSetupComponent', () => {
  let component: DefaultSetupComponent;
  let fixture: ComponentFixture<DefaultSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultSetupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DefaultSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
