import { TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import { Icon } from './icon';
import { IconStub } from './icon.stub';

export function stubIconIn(component: Type<unknown>): void {
    TestBed.overrideComponent(component, {
        remove: { imports: [Icon] },
        add: { imports: [IconStub] }
    });
}