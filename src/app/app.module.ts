import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { IonicApp, IonicModule } from 'ionic-angular';
import { AListaApp } from './app.component';
// Pages
import { AboutPage } from '../pages/about/about';
import { ItemCreatePage } from '../pages/item-create/item-create';
import { CommentCreatePage } from '../pages/comment-create/comment-create';
import { LoginPage } from '../pages/login/login';
import { ProfilePage } from '../pages/profile/profile';
import { SignupPage } from '../pages/signup/signup';
import { ResetPasswordPage } from '../pages/reset-password/reset-password';
import { TabsPage } from '../pages/tabs/tabs';
import { ListItemsPage } from '../pages/list-items/list-items';
import { ListCommentsPage } from '../pages/list-comments/list-comments';
import { ListCreatePage } from '../pages/list-create/list-create';
import { ListsPage } from '../pages/lists/lists';
// Custom components
import { ListComponent } from '../shared/components/list.component';
import { UserAvatarComponent } from '../shared/components/user-avatar.component';
// providers
import { APP_PROVIDERS } from '../providers/app.providers';

@NgModule({
  declarations: [
    AListaApp,
    AboutPage,
    ItemCreatePage,
    CommentCreatePage,
    LoginPage,
    ProfilePage,
    SignupPage,
    ResetPasswordPage,
    TabsPage,
    ListItemsPage,
    ListCommentsPage,
    ListCreatePage,
    ListsPage,
    ListComponent,
    UserAvatarComponent
  ],
  imports: [
    IonicModule.forRoot(AListaApp),
    HttpModule,
    FormsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    AListaApp,
    AboutPage,
    ItemCreatePage,
    CommentCreatePage,
    LoginPage,
    ProfilePage,
    SignupPage,
    ResetPasswordPage,
    TabsPage,
    ListItemsPage,
    ListCommentsPage,
    ListCreatePage,
    ListsPage
  ],
  providers: [APP_PROVIDERS]
})
export class AppModule {}
