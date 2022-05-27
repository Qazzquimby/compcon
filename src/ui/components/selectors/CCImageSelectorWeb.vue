<template>
  <cc-solo-dialog
    id="image-selector-dialog"
    ref="dialog"
    fullscreen
    no-confirm
    title="Select Image"
  >
    <v-container fluid>
      <v-row>
        <v-col cols="12" md="6">
          <div class="heading h3 ml-n2">AVAILABLE IMAGES</div>
          <mech-image-selector
            v-if="type === 'mech'"
            :mech="item"
            @set-img="selectedImage = $event"
          />
          <pilot-image-selector
            v-if="type === 'pilot'"
            :pilot="item"
            @set-img="selectedImage = $event"
          />
          <v-divider class="mx-3" />
          <div class="heading h3 ml-n2">UPLOAD IMAGE</div>
          <v-file-input
            ref="fileInput"
            class="px-6 mt-2"
            accept="image/*"
            dense
            outlined
            placeholder="Select Image"
            prepend-icon="mdi-file-upload-outline"
            :disabled="loading"
            @change="uploadImage"
          />
          <div>
            <i>10MB maximum file size. PNG files over 5MB will be converted to JPEGs.</i>
          </div>
        </v-col>
        <v-col>
          <div class="text-center">
            <v-img
              :src="displayImage"
              contain
              max-width="500px"
              max-height="500px"
              class="ml-auto mr-auto"
              :style="`image-rendering: ${isPixel ? 'pixelated' : 'crisp-edges'};`"
            />
            <cc-btn
              color="secondary"
              :disabled="!selectedPresetImage && (!uploadedImageData || loading)"
              @click="saveImage()"
            >
              <template v-if="!loading">Set Image</template>
              <template v-else>
                <v-progress-circular size="25" width="3" indeterminate />
              </template>
            </cc-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </cc-solo-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import path from 'path'
import imgur from '../../../io/apis/imgur'
import MechImageSelector from './components/_MechImageSelector.vue'
import PilotImageSelector from './components/_PilotImageSelector.vue'

export default Vue.extend({
  name: 'web-image-selector',
  components: { MechImageSelector, PilotImageSelector },
  props: {
    item: {
      type: Object,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    selectedPresetImage: null,
    uploadedImageData: null,
    loading: false,
  }),
  computed: {
    displayImage() {
      if (this.selectedPresetImage) return this.selectedPresetImage
      if (this.uploadedImageData) return `data:image/png;base64,${this.uploadedImageData}`
      else if (this.item.Portrait) return this.item.Portrait
      else return 'https://via.placeholder.com/550'
    },
    isPixel() {
      return this.selectedPresetImage && path.basename(this.selectedPresetImage).includes('_pixel')
    },
  },
  methods: {
    uploadImage(file: File | null) {
      if (!file) {
        this.uploadedImageData = null
        return
      }
      this.selectedPresetImage = null
      const reader = new FileReader()
      reader.addEventListener(
        'load',
        () => {
          // get base64 without url headers for imgur
          this.uploadedImageData = btoa(reader.result as string)
        },
        false
      )
      reader.readAsBinaryString(file)
    },
    async saveImage() {
      if (this.selectedPresetImage && this.validURL(this.selectedPresetImage)) {
        this.item.PortraitController.SetCloudImage(this.selectedPresetImage)
        this.close()
      } else if (this.selectedPresetImage) {
        this.item.PortraitController.SetCloudImage(null)
        this.item.PortraitController.SetLocalImage(path.basename(this.selectedPresetImage))
        this.close()
      } else {
        this.loading = true
        this.selectedPresetImage = null
        const link = await imgur.uploadImage(this.uploadedImageData)
        try {
          this.item.PortraitController.SetCloudImage(link)
          this.$emit('notify', 'Cloud Upload Successful')
        } catch (err) {
          this.$emit('notify', `Error Uploading to Cloud:<br>${err.message}`)
          this.loading = true
          this.selectedPresetImage = null
        }
        this.close()
        this.$refs.fileInput.value = null
        this.loading = false
        this.uploadedImageData = null
      }
    },
    // Pulled from Stackoverflow: https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
    validURL(str: string): boolean {
      const pattern = new RegExp(
        '^(https?:\\/\\/)?' + // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
          '(\\#[-a-z\\d_]*)?$',
        'i'
      ) // fragment locator
      return !!pattern.test(str)
    },
    open() {
      this.$refs.dialog.show()
    },
    close() {
      this.$refs.dialog.hide()
    },
  },
})
</script>
