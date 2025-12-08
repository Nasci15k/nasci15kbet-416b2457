
-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Enum para status de transações
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Enum para tipo de transações
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'bet', 'win', 'bonus', 'refund', 'adjustment');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  cpf TEXT,
  avatar_url TEXT,
  balance DECIMAL(15,2) DEFAULT 0.00,
  bonus_balance DECIMAL(15,2) DEFAULT 0.00,
  total_deposited DECIMAL(15,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(15,2) DEFAULT 0.00,
  total_wagered DECIMAL(15,2) DEFAULT 0.00,
  total_won DECIMAL(15,2) DEFAULT 0.00,
  vip_level INTEGER DEFAULT 0,
  vip_points INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de roles de usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Tabela de configurações do sistema
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Tabela de configurações de aparência
CREATE TABLE public.appearance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT DEFAULT 'Nasci15kBet',
  site_logo TEXT,
  site_favicon TEXT,
  primary_color TEXT DEFAULT '#F59E0B',
  secondary_color TEXT DEFAULT '#10B981',
  accent_color TEXT DEFAULT '#8B5CF6',
  background_color TEXT DEFAULT '#0A0E1A',
  header_color TEXT DEFAULT '#0F1629',
  sidebar_color TEXT DEFAULT '#0F1629',
  font_family TEXT DEFAULT 'Outfit',
  hero_banners JSONB DEFAULT '[]',
  footer_text TEXT,
  social_links JSONB DEFAULT '{}',
  custom_css TEXT,
  custom_js TEXT,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  maintenance_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de provedores de jogos
CREATE TABLE public.game_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias de jogos
CREATE TABLE public.game_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de jogos
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  provider_id UUID REFERENCES public.game_providers(id),
  category_id UUID REFERENCES public.game_categories(id),
  image TEXT,
  is_original BOOLEAN DEFAULT FALSE,
  is_live BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  rtp DECIMAL(5,2),
  min_bet DECIMAL(15,2) DEFAULT 0.10,
  max_bet DECIMAL(15,2) DEFAULT 1000.00,
  order_index INTEGER DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2),
  balance_after DECIMAL(15,2),
  status transaction_status DEFAULT 'pending',
  reference_id TEXT,
  game_id UUID REFERENCES public.games(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões de jogo
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) NOT NULL,
  start_balance DECIMAL(15,2),
  end_balance DECIMAL(15,2),
  total_bet DECIMAL(15,2) DEFAULT 0,
  total_win DECIMAL(15,2) DEFAULT 0,
  rounds_played INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de métodos de pagamento
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  min_deposit DECIMAL(15,2) DEFAULT 10.00,
  max_deposit DECIMAL(15,2) DEFAULT 50000.00,
  min_withdrawal DECIMAL(15,2) DEFAULT 20.00,
  max_withdrawal DECIMAL(15,2) DEFAULT 10000.00,
  deposit_fee_percent DECIMAL(5,2) DEFAULT 0,
  withdrawal_fee_percent DECIMAL(5,2) DEFAULT 0,
  processing_time TEXT DEFAULT 'Instantâneo',
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de depósitos
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  amount DECIMAL(15,2) NOT NULL,
  fee DECIMAL(15,2) DEFAULT 0,
  status transaction_status DEFAULT 'pending',
  external_id TEXT,
  pix_code TEXT,
  qr_code TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de saques
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  amount DECIMAL(15,2) NOT NULL,
  fee DECIMAL(15,2) DEFAULT 0,
  status transaction_status DEFAULT 'pending',
  pix_key TEXT,
  pix_key_type TEXT,
  bank_info JSONB DEFAULT '{}',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de bônus
CREATE TABLE public.bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  value_type TEXT DEFAULT 'percent',
  min_deposit DECIMAL(15,2),
  max_bonus DECIMAL(15,2),
  wagering_requirement DECIMAL(5,2) DEFAULT 35,
  valid_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT TRUE,
  code TEXT UNIQUE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  target_users TEXT DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de bônus de usuários
CREATE TABLE public.user_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bonus_id UUID REFERENCES public.bonuses(id) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  wagered DECIMAL(15,2) DEFAULT 0,
  required_wagering DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de níveis VIP
CREATE TABLE public.vip_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  cashback_percent DECIMAL(5,2) DEFAULT 0,
  withdrawal_priority BOOLEAN DEFAULT FALSE,
  dedicated_support BOOLEAN DEFAULT FALSE,
  special_bonuses BOOLEAN DEFAULT FALSE,
  benefits JSONB DEFAULT '[]',
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de promoções
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  type TEXT DEFAULT 'general',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  terms TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de afiliados
CREATE TABLE public.affiliate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_type TEXT DEFAULT 'revenue_share',
  commission_percent DECIMAL(5,2) DEFAULT 30,
  min_payout DECIMAL(15,2) DEFAULT 100,
  cookie_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  terms TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de afiliados
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code TEXT UNIQUE NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  total_signups INTEGER DEFAULT 0,
  total_deposits DECIMAL(15,2) DEFAULT 0,
  total_commission DECIMAL(15,2) DEFAULT 0,
  pending_commission DECIMAL(15,2) DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de comissões de afiliados
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações da API
CREATE TABLE public.api_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  agent_token TEXT,
  secret_key TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  rtp_default INTEGER DEFAULT 97,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de atividade
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens de suporte
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas de suporte
CREATE TABLE public.support_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de páginas personalizadas
CREATE TABLE public.custom_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de popups
CREATE TABLE public.popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  image TEXT,
  button_text TEXT,
  button_url TEXT,
  trigger_type TEXT DEFAULT 'on_load',
  delay_seconds INTEGER DEFAULT 0,
  show_once BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

-- Função para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() = user_id);

-- Políticas RLS para user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- Políticas RLS para configurações (apenas admin)
CREATE POLICY "Admins can manage system settings" ON public.system_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can view appearance" ON public.appearance_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage appearance" ON public.appearance_settings FOR ALL USING (public.is_admin());

-- Políticas RLS para jogos (público para leitura)
CREATE POLICY "Anyone can view active providers" ON public.game_providers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage providers" ON public.game_providers FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can view active categories" ON public.game_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.game_categories FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can view active games" ON public.games FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage games" ON public.games FOR ALL USING (public.is_admin());

-- Políticas RLS para transações
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (public.is_admin());
CREATE POLICY "System can insert transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para sessões de jogo
CREATE POLICY "Users can view own sessions" ON public.game_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.game_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.game_sessions FOR ALL USING (public.is_admin());

-- Políticas RLS para pagamentos
CREATE POLICY "Anyone can view active payment methods" ON public.payment_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage deposits" ON public.deposits FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage withdrawals" ON public.withdrawals FOR ALL USING (public.is_admin());

-- Políticas RLS para bônus
CREATE POLICY "Anyone can view active bonuses" ON public.bonuses FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage bonuses" ON public.bonuses FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view own user_bonuses" ON public.user_bonuses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user_bonuses" ON public.user_bonuses FOR ALL USING (public.is_admin());

-- Políticas RLS para VIP
CREATE POLICY "Anyone can view vip levels" ON public.vip_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage vip levels" ON public.vip_levels FOR ALL USING (public.is_admin());

-- Políticas RLS para promoções
CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL USING (public.is_admin());

-- Políticas RLS para afiliados
CREATE POLICY "Anyone can view affiliate settings" ON public.affiliate_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage affiliate settings" ON public.affiliate_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view own affiliate" ON public.affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own affiliate" ON public.affiliates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage affiliates" ON public.affiliates FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view own commissions" ON public.affiliate_commissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.id = affiliate_commissions.affiliate_id AND affiliates.user_id = auth.uid())
);
CREATE POLICY "Admins can manage commissions" ON public.affiliate_commissions FOR ALL USING (public.is_admin());

-- Políticas RLS para API settings (apenas admin)
CREATE POLICY "Admins can manage api settings" ON public.api_settings FOR ALL USING (public.is_admin());

-- Políticas RLS para logs
CREATE POLICY "Admins can view logs" ON public.activity_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "System can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- Políticas RLS para notificações
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.is_admin());

-- Políticas RLS para suporte
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage tickets" ON public.support_tickets FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view ticket replies" ON public.support_replies FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE support_tickets.id = support_replies.ticket_id AND support_tickets.user_id = auth.uid())
);
CREATE POLICY "Users can create replies" ON public.support_replies FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE support_tickets.id = support_replies.ticket_id AND support_tickets.user_id = auth.uid())
);
CREATE POLICY "Admins can manage replies" ON public.support_replies FOR ALL USING (public.is_admin());

-- Políticas RLS para páginas e popups
CREATE POLICY "Anyone can view active pages" ON public.custom_pages FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage pages" ON public.custom_pages FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can view active popups" ON public.popups FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage popups" ON public.popups FOR ALL USING (public.is_admin());

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    UPPER(LEFT(MD5(NEW.id::text), 8))
  );
  
  -- Atribuir role de user por padrão
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appearance_updated_at BEFORE UPDATE ON public.appearance_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração padrão de aparência
INSERT INTO public.appearance_settings (site_name, primary_color, secondary_color, accent_color)
VALUES ('Nasci15kBet', '#F59E0B', '#10B981', '#8B5CF6');

-- Inserir níveis VIP padrão
INSERT INTO public.vip_levels (level, name, min_points, cashback_percent, benefits) VALUES
(0, 'Bronze', 0, 1, '["Acesso básico", "Suporte por chat"]'),
(1, 'Prata', 1000, 2, '["Cashback 2%", "Bônus semanais"]'),
(2, 'Ouro', 5000, 3, '["Cashback 3%", "Gerente dedicado", "Saques prioritários"]'),
(3, 'Platina', 20000, 5, '["Cashback 5%", "Convites VIP", "Limites aumentados"]'),
(4, 'Diamante', 100000, 10, '["Cashback 10%", "Benefícios exclusivos", "Presentes especiais"]');

-- Inserir categorias padrão
INSERT INTO public.game_categories (name, slug, icon, order_index) VALUES
('Todos', 'all', 'Gamepad2', 0),
('Slots', 'slots', 'Cherry', 1),
('Crash', 'crash', 'Rocket', 2),
('Ao Vivo', 'live', 'Video', 3),
('Cartas', 'cards', 'Spade', 4),
('Roleta', 'roulette', 'Circle', 5),
('Esportes', 'sports', 'Trophy', 6);

-- Inserir método de pagamento PIX
INSERT INTO public.payment_methods (name, type, min_deposit, max_deposit, min_withdrawal, max_withdrawal) VALUES
('PIX', 'pix', 10.00, 50000.00, 20.00, 10000.00);

-- Inserir configuração de afiliados
INSERT INTO public.affiliate_settings (commission_type, commission_percent, min_payout) VALUES
('revenue_share', 30, 100);
