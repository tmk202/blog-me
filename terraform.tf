terraform {
    required_providers {
        cloudflare = {
            source  = "cloudflare/cloudflare"
            version = "~> 4.0"
        }
    }
}

provider "cloudflare" {
    api_token = "PMnMt8Qg5Vk97eEwvNFyrsNdkO5565fUqtQy4omH"
}
# 1. Define the list of domains you want to manage
locals {
    my_domains =["senior-care-blog-01.pages.dev]
}
#2 . Automatically fetch the zone IDS for those domains

data "cloudflare_zone" "all_zones" {
    for_each = toset(local.my_domains)
    name = each.value
}

#3 create a record on every zone Automatically

resource "cloudflare_record" "blog" {
    for_each = data.cloudflare_zone.all_zones
    zone_id = each.value.id
    name = "dev-test"
    value = "1.2.3.4"
    type = "A"
    proxied = true
}