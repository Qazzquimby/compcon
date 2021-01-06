import { getImagePath, ImageTag } from '@/io/ImageManagement'

interface IFactionData {
  id: string
  name: string
  description: string
  logo: string
  color: string
  logo_url?: string
}

class Faction {
  public readonly ID: string
  public readonly Name: string
  public readonly Description: string
  public readonly Color: string
  private _logo: string
  private _logo_url?: string

  public constructor(data: IFactionData) {
    this.ID = data.id
    this.Name = data.name
    this.Description = data.description
    this.Color = data.color
    this._logo = data.logo
    this._logo_url = data.logo_url
  }

  public get LogoIsExternal(): boolean {
    return !!this._logo_url
  }

  public get Logo(): string {
    if (this._logo_url) return this._logo_url
    else if (this._logo) return getImagePath(ImageTag.Logo, `${this._logo}.svg`)
    else return '' // TODO: placeholder logo?
  }
}

export { Faction, IFactionData }
