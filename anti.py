import requests

TOKEN = 'TOKEN_BOT'
GUILD_ID = 'SERVER_ID'
ROLE_ID = 'CARGO_ID'  # Excluir cargo bugado pelo terminal 

get_url = f'https://discord.com/api/v10/guilds/{GUILD_ID}/roles'
headers = {'Authorization': f'Bot {TOKEN}'}

get_response = requests.get(get_url, headers=headers)
print(f"Get Status Code: {get_response.status_code}")
if get_response.status_code == 200:
    roles = get_response.json()
    target_role = next((role for role in roles if role['id'] == ROLE_ID), None)
    if target_role:
        print(f"Cargo encontrado: {target_role['name']}")
    else:
        print("Cargo não encontrado no servidor.")
else:
    print(f"Erro ao obter cargos: {get_response.text}")

# Tente excluir o cargo
delete_url = f'https://discord.com/api/v10/guilds/{GUILD_ID}/roles/{ROLE_ID}'
delete_response = requests.delete(delete_url, headers=headers)

print(f"Delete Status Code: {delete_response.status_code}")
if delete_response.status_code == 204:
    print("Cargo excluído com sucesso!")
else:
    print(f"Erro ao excluir o cargo: {delete_response.text}")


# Após o código existente, adicione:

# Tente modificar o cargo
modify_url = f'https://discord.com/api/v10/guilds/{GUILD_ID}/roles/{ROLE_ID}'
modify_data = {
    "name": "Anti delete (Modificado)",
    "color": 0xafffa2  # Kernal
}
modify_response = requests.patch(modify_url, headers=headers, json=modify_data)

print(f"Modify Status Code: {modify_response.status_code}")
if modify_response.status_code == 200:
    print("Cargo modificado com sucesso!")
    print(modify_response.json())
else:
    print(f"Erro ao modificar o cargo: {modify_response.text}")

    # Após o código de modificação, adicione:
    
    # Tente criar um novo cargo via 
    create_url = f'https://discord.com/api/v10/guilds/{GUILD_ID}/roles'
    create_data = {
        "name": "Anti delete",
        "permissions": "0",
        "color": 0
    }
    create_response = requests.post(create_url, headers=headers, json=create_data)
    
    print(f"Create Status Code: {create_response.status_code}")
    if create_response.status_code == 200:
        print("Novo cargo criado com sucesso!")
        new_role = create_response.json()
        print(f"ID do novo cargo: {new_role['id']}")
    else:
        print(f"Erro ao criar novo cargo: {create_response.text}")

        # Adicione este código no início do seu script, após obter a lista de cargos
        
        print("Lista de todos os cargos:")
        for role in roles:
            print(f"ID: {role['id']}, Nome: {role['name']}, Gerenciado: {role.get('managed', False)}, Posição: {role['position']}")
        
        # Continuação do seu código existente...

        # Após o código existente
        
        # Tente mover o cargo na hierarquia
        move_url = f'https://discord.com/api/v10/guilds/{GUILD_ID}/roles'
        move_data = [{"id": ROLE_ID, "position": 1}]  # Move para a posição 1 (logo acima do @everyone)
        move_response = requests.patch(move_url, headers=headers, json=move_data)
        
        print(f"Move Status Code: {move_response.status_code}")
        if move_response.status_code == 200:
            print("Cargo movido com sucesso!")
        else:
            print(f"Erro ao mover o cargo: {move_response.text}")

            print(f"Delete Status Code: {delete_response.status_code}")
            print(f"Delete Response: {delete_response.text}")