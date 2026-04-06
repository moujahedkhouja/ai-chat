import { Component, output, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationSummary } from '../../../core/chat-history.service';
import { TranslateModule } from '@ngx-translate/core';

interface ConversationGroup {
  labelKey: string;
  items: ConversationSummary[];
}

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss'
})
export class ConversationListComponent {
  conversations = input<ConversationSummary[]>([]);
  activeId = input<string | null>(null);
  select = output<string>();
  newChat = output<void>();
  delete = output<string>();

  searchQuery = signal('');

  groups = computed(() => {
    const now = new Date();
    const todayStart     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86_400_000;

    const query   = this.searchQuery().toLowerCase();
    const filtered = this.conversations().filter(c =>
      c.title.toLowerCase().includes(query)
    );

    const today: ConversationSummary[]     = [];
    const yesterday: ConversationSummary[] = [];
    const older: ConversationSummary[]     = [];

    for (const c of filtered) {
      const t = new Date(c.updatedAt).getTime();
      if (t >= todayStart)     today.push(c);
      else if (t >= yesterdayStart) yesterday.push(c);
      else older.push(c);
    }

    return [
      { labelKey: 'chat.today',     items: today },
      { labelKey: 'chat.yesterday', items: yesterday },
      { labelKey: 'chat.older',     items: older }
    ].filter(g => g.items.length > 0);
  });
}
