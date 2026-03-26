import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatService);
  });

  it('sendMessage() emits a string after a delay', fakeAsync(() => {
    let result: string | undefined;
    service.sendMessage('conv-1', 'hello').subscribe(r => (result = r));
    expect(result).toBeUndefined(); // not emitted yet
    tick(1500);
    expect(typeof result).toBe('string');
    expect(result!.length).toBeGreaterThan(0);
  }));
});
