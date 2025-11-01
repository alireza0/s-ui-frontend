<template>
  <AdminModal 
    v-model="editModal.visible"
    :visible="editModal.visible"
    :user="editModal.user"
    @close="closeEditModal"
    @save="saveEditModal"
  />
  <AdminEnable2FAModal 
    v-model="enable2FAModal.visible"
    :visible="enable2FAModal.visible"
    :user="enable2FAModal.user"
    @close="closeEnable2FAModal"
    @save="saveEnable2FAModal"
  />
  <ChangeModal 
    v-model="changesModal.visible"
    :visible="changesModal.visible"
    :admins="users.map((u:any) => u.username)"
    :actor="changesModal.actor"
    @close="closeChangesModal"
  />
  <TokenModal 
    v-model="tokenModal.visible"
    :visible="tokenModal.visible"
    @close="closeTokenModal"
  />
  <v-dialog v-model="open2FAdisable" width="auto">
    <v-card
      max-width="400"
      prepend-icon="mdi-alert"
	  :title="$t('warning')"
	  :text="$t('admin.confirm2FAdisable')">
      <template v-slot:actions>
        <v-btn
		  color="primary"
          variant="outlined"
          @click="open2FAdisable = false"
        >{{ $t('close') }}</v-btn>
		<v-btn
		  variant="tonal"
          @click="saveDisable2FA()"
        >{{ $t('disable') }}</v-btn>
      </template>
    </v-card>
  </v-dialog>
  <v-row>
    <v-col cols="12" justify="center" align="center">
      <v-btn color="primary" @click="showChangesModal('')" style="margin: 0 5px;">{{ $t('admin.changes') }}</v-btn>
      <v-btn color="primary" @click="showTokenModal()">{{ $t('admin.api.token') }}</v-btn>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" sm="4" md="3" lg="2" v-for="(item, index) in <any[]>users" :key="item.id">
      <v-card rounded="xl" elevation="5" min-width="200" :title="item.username">
        <v-card-subtitle style="margin-top: -20px;">
          {{ $t('admin.lastLogin') }}
        </v-card-subtitle>
        <v-card-text>
          <v-row>
            <v-col>{{ $t('admin.date') }}</v-col>
            <v-col>
              {{ item.loginDate }}
            </v-col>
          </v-row>
          <v-row>
            <v-col>{{ $t('admin.time') }}</v-col>
            <v-col>
              {{ item.loginTime }}
            </v-col>
          </v-row>
          <v-row>
            <v-col>IP</v-col>
            <v-col>
              {{ item.ip }}
            </v-col>
          </v-row>
		  <v-row>
            <v-col>2FA</v-col>
            <v-col>
              {{ item.totp ? $t('admin.enabled') : $t('admin.disabled') }}
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions style="padding: 0;">
          <v-btn icon="mdi-account-edit" @click="showEditModal(item)">
            <v-icon />
            <v-tooltip activator="parent" location="top" :text="$t('actions.edit')"></v-tooltip>
          </v-btn>
		  <v-btn icon="mdi-shield-lock-outline" @click="show2FAModal(item)">
            <v-icon />
            <v-tooltip activator="parent" location="top" :text="$t('actions.edit2fa')"></v-tooltip>
          </v-btn>
          <v-btn icon="mdi-list-box-outline" @click="showChangesModal(item.username)">
            <v-icon />
            <v-tooltip activator="parent" location="top" :text="$t('admin.changes')"></v-tooltip>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import AdminModal from '@/layouts/modals/Admin.vue'
import AdminEnable2FAModal from '@/layouts/modals/AdminEnable2FA.vue'
import ChangeModal  from '@/layouts/modals/Changes.vue'
import TokenModal from '@/layouts/modals/Token.vue'
import { i18n } from '@/locales'
import HttpUtils from '@/plugins/httputil'
import { Ref, ref, inject, onMounted } from 'vue'

const loading:Ref = inject('loading')?? ref(false)

const users = ref(<any[]>[])
const open2FAdisable = ref(false)

onMounted(async () => {loadData()})

const loadData = async () => {
  loading.value = true
  const msg = await HttpUtils.get('api/users')
  loading.value = false
  if (msg.success) {
    msg.obj.forEach((u:any) => {
      const lastLogin = u.lastLogin.split(" ")
      const localLastLogin = lastLogin.length > 2 ? dateFormatted(Date.parse(lastLogin[0] + " " + lastLogin[1])) : "- -"
      const loginDateTime = localLastLogin.split(" ")
      users.value.push({
        id: u.id,
        username: u.username,
        loginDate: loginDateTime[0],
        loginTime: loginDateTime[1],
        ip: lastLogin[2]?? "-",
		totp: u.totp
      })
    })
  }
}

const dateFormatted = (dt: number): string => {
  const locale = i18n.global.locale.value.replace('zh', 'zh-')
  const date = new Date(dt)
  return date.toLocaleString(locale)
}

const editModal = ref({
  visible: false,
  user: {},
})

const showEditModal = (user: any) => {
  editModal.value.user = user
  editModal.value.visible = true
}
const closeEditModal = () => {
  editModal.value.visible = false
  editModal.value.user = {}
}
const saveEditModal = async (data:any) => {
  loading.value=true
  const response = await HttpUtils.post('api/changePass',data)
  if(response.success){
    setTimeout(() => {
      loading.value=false
      editModal.value.visible = false
    }, 500)
  } else {
    loading.value=false
  }
}

const show2FAModal = (user: any) => {
	if (user.totp) {
		open2FAdisable.value = true
	} else {
		showEnable2FAModal(user)
	}
}

const enable2FAModal = ref({
  visible: false,
  user: {},
})

const showEnable2FAModal = (user: any) => {
  enable2FAModal.value.user = user
  enable2FAModal.value.visible = true
}
const closeEnable2FAModal = () => {
  enable2FAModal.value.visible = false
  enable2FAModal.value.user = {}
}
const saveEnable2FAModal = async (data: any) => {
  loading.value=true
  const response = await HttpUtils.post('api/enable2fa',data)
  if(response.success){
    setTimeout(() => {
      loading.value=false
      closeEnable2FAModal()
    }, 500)
  } else {
    loading.value=false
  }
}

const saveDisable2FA = async () => {
  loading.value=true
  const response = await HttpUtils.post('api/disable2fa', null)
  if(response.success){
    setTimeout(() => {
      loading.value=false
	  open2FAdisable.value = false
    }, 500)
  } else {
    loading.value=false
  }
}

const changesModal = ref({
  visible: false,
  actor: '',
})
const showChangesModal = (actor: string) => {
  changesModal.value.actor = actor
  changesModal.value.visible = true
}
const closeChangesModal = () => {
  changesModal.value.visible = false
  changesModal.value.actor = ''
}

const tokenModal = ref({
  visible: false,
})
const showTokenModal = () => {
  tokenModal.value.visible = true
}
const closeTokenModal = () => {
  tokenModal.value.visible = false
}
</script>