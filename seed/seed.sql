-- Seed: angka diambil dari prototipe (js/data.js), USD.
insert into game_config values ('start_cash',500),('tax',0.11),('market_depth',40),('loan_rate',0.001),('btn_login',5),('btn_make',10),('btn_sell',10),('btn_speed_sec',1800);

insert into item_types (id, kind, name_id, name_en, base_price, unlock_level) values
 ('cotton','raw','Kapas','Cotton',0.6,1),('hide','raw','Kulit mentah','Raw hide',5,1),('latex','raw','Lateks','Latex',2.5,1),('dye','raw','Pewarna','Dye',3,1),
 ('thread','material','Benang','Thread',1,1),('rubber','material','Karet','Rubber',4,1),('leather','material','Kulit','Leather',8,1),('fabric','material','Kain','Fabric',6,2),
 ('shoes','product','Sepatu','Shoes',40,1),('shirt','product','Kaos','T-shirt',25,2),('bag','product','Tas','Bag',90,3),('dress','product','Gaun','Dress',140,3),('jacket','product','Jaket','Jacket',260,4);
insert into npc_market (item_id) select id from item_types;

insert into recipes values
 ('thread','thread',20,300,'factory',1),('rubber','rubber',5,600,'factory',1),('leather','leather',5,900,'factory',1),('fabric','fabric',10,600,'factory',2),
 ('shoes','shoes',5,600,'factory',1),('shirt','shirt',10,900,'factory',2),('bag','bag',5,1800,'factory',3),('dress','dress',5,2400,'factory',3),('jacket','jacket',4,3600,'factory',4);
insert into recipe_inputs values
 ('thread','cotton',10),('rubber','latex',5),('leather','hide',5),('leather','dye',1),('fabric','thread',20),('fabric','dye',4),
 ('shoes','leather',5),('shoes','rubber',5),('shoes','thread',10),('shirt','fabric',20),('shirt','thread',10),
 ('bag','leather',15),('bag','thread',15),('dress','fabric',15),('dress','thread',10),('dress','dye',3),
 ('jacket','leather',10),('jacket','fabric',10),('jacket','thread',10);

insert into facility_types values   -- type, base_cost, base_seconds, build_cost, build_seconds, rent_hour
 ('office',800,3600,0,0,4),('factory',1000,3600,200,60,4),('store',1200,5400,150,60,4),('warehouse',300,3600,300,60,4),('farm',600,3600,250,60,4);
