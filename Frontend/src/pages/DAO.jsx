import React, { useState, useEffect, useCallback } from 'react';
import { useSuiClient, useWallet } from '@suiet/wallet-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import ConnectButtonWrapper from '../components/ConnectButtonWrapper.jsx';
import { Wallet, Users, Plus, Vote, Eye, CheckCircle, XCircle, Send } from 'lucide-react';

const MemeDAOInterface = () => {
  const wallet = useWallet();
  const suiClient = useSuiClient();
  const [daos, setDaos] = useState([]);
  const [selectedDao, setSelectedDao] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [createDaoForm, setCreateDaoForm] = useState({
    name: '',
    description: '',
    members: [''],
    threshold: 1
  });
  
  const [proposalForm, setProposalForm] = useState({
    type: 'transfer',
    title: '',
    description: '',
    targetAddress: '',
    amount: ''
  });

  const PACKAGE_ID = "0xc02dfe216111d9fcf8149a959b21a2baf0c9058dfea51498ba3a9a7c518fea8c";
const REGISTRY_ID = "0x04daf744a1d8f8bd0299e021ffd2a5aa5cfeccd00bd8b766937c46323a92fe90";
const COIN_TYPE = "0x2::sui::SUI";
  useEffect(() => {
    if (wallet.connected && suiClient) {
      fetchUserDAOs();
    }
  }, [wallet.connected, suiClient, wallet.account]);

  const fetchUserDAOs = useCallback(async () => {
    if (!suiClient || !wallet.account?.address) return;
    
    setLoading(true);
    try {
      const daoEvents = await suiClient.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::meme_dao::DAOCreated` },
        limit: 50,
        order: 'descending'
      });

      const userDaos = [];
      
      for (const event of daoEvents.data) {
        try {
          const eventData = event.parsedJson;
          if (eventData?.dao_id) {
            try {
              const daoObject = await suiClient.getObject({
                id: eventData.dao_id,
                options: { showContent: true, showType: true }
              });

              if (daoObject.data?.content) {
                const fields = daoObject.data.content.fields;
                const members = fields.members || [];
                
                if (members.includes(wallet.account.address)) {
                  userDaos.push({
                    id: eventData.dao_id,
                    name: fields.name || eventData.name || 'Unknown DAO',
                    description: fields.description || '',
                    members: members,
                    voting_threshold: fields.voting_threshold || eventData.threshold || 1,
                    treasury_balance: fields.treasury?.fields?.value || 0,
                    proposal_count: fields.proposal_count || 0,
                    creator: fields.creator || eventData.creator,
                    is_active: fields.is_active !== false
                  });
                }
              }
            } catch (objErr) {
              if (eventData.initial_members?.includes(wallet.account.address)) {
                userDaos.push({
                  id: eventData.dao_id,
                  name: eventData.name || 'Unknown DAO',
                  description: '',
                  members: eventData.initial_members || [],
                  voting_threshold: eventData.threshold || 1,
                  treasury_balance: 0,
                  proposal_count: 0,
                  creator: eventData.creator,
                  is_active: true
                });
              }
            }
          }
        } catch (err) {
          console.error('Error processing DAO event:', err);
        }
      }

      setDaos(userDaos);
      setError(userDaos.length > 0 ? '' : 'No DAOs found. Create one to get started!');

    } catch (err) {
      console.error('Error fetching DAOs:', err);
      setError(`Failed to fetch DAOs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [suiClient, wallet.account, PACKAGE_ID]);

  const fetchProposals = useCallback(async (daoId) => {
    if (!suiClient || !daoId) return;
    
    try {
      const proposalEvents = await suiClient.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::meme_dao::ProposalCreated` },
        limit: 50,
        order: 'descending'
      });

      const daoProposals = proposalEvents.data.filter(event => 
        event.parsedJson?.dao_id === daoId
      );

      const proposalData = [];
      for (const event of daoProposals) {
        try {
          const eventData = event.parsedJson;
          const proposalId = eventData.proposal_id;
          
          try {
            const proposalField = await suiClient.getDynamicFieldObject({
              parentId: daoId,
              name: { type: 'u64', value: proposalId.toString() }
            });

            if (proposalField.data?.content) {
              const fields = proposalField.data.content.fields;
              proposalData.push({
                id: proposalId,
                title: fields.title || eventData.title || 'Untitled Proposal',
                description: fields.description || '',
                proposal_type: fields.proposal_type || eventData.proposal_type || 0,
                proposer: fields.proposer || eventData.proposer,
                amount: fields.amount || eventData.amount || 0,
                votes_for: fields.votes_for || 0,
                votes_against: fields.votes_against || 0,
                executed: fields.executed || false,
                target_address: fields.target_address || '',
                expires_at: fields.expires_at || 0
              });
            }
          } catch (propErr) {
            proposalData.push({
              id: eventData.proposal_id,
              title: eventData.title || 'Untitled Proposal',
              description: '',
              proposal_type: eventData.proposal_type || 0,
              proposer: eventData.proposer,
              amount: eventData.amount || 0,
              votes_for: 0,
              votes_against: 0,
              executed: false,
              target_address: '',
              expires_at: 0
            });
          }
        } catch (err) {
          console.error('Error processing proposal event:', err);
        }
      }

      setProposals(proposalData);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError(`Failed to fetch proposals: ${err.message}`);
    }
  }, [suiClient, PACKAGE_ID]);

  const createDAO = async () => {
    if (!wallet.connected || !suiClient) return;
    
    setLoading(true);
    try {
      const tx = new TransactionBlock();
      
      const members = createDaoForm.members.filter(m => m.trim() !== '');
      if (!members.includes(wallet.account.address)) {
        members.push(wallet.account.address);
      }
      
      const initialFundsCoin = tx.splitCoins(tx.gas, [tx.pure(0)]);

      tx.moveCall({
        target: `${PACKAGE_ID}::meme_dao::create_dao`,
        typeArguments: [COIN_TYPE],
        arguments: [
          tx.object(REGISTRY_ID),
          tx.pure(Array.from(new TextEncoder().encode(createDaoForm.name))),
          tx.pure(Array.from(new TextEncoder().encode(createDaoForm.description))),
          tx.pure(members),
          tx.pure(createDaoForm.threshold),
          initialFundsCoin,
          tx.object('0x6')
        ]
      });

      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: { showEffects: true, showEvents: true }
      });

      if (result.effects?.status?.status === 'success') {
        setError('DAO created successfully! Refreshing...');
        setCreateDaoForm({ name: '', description: '', members: [''], threshold: 1 });
        setTimeout(() => {
          fetchUserDAOs();
          setActiveTab('overview');
        }, 3000);
      } else {
        setError('Transaction failed: ' + (result.effects?.status?.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating DAO:', err);
      setError(`Failed to create DAO: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createProposal = async () => {
    if (!wallet.connected || !suiClient || !selectedDao) return;
    
    // Validate user is a DAO member
    if (!selectedDao.members.includes(wallet.account.address)) {
      setError('You must be a member of this DAO to create proposals');
      return;
    }
    
    setLoading(true);
    try {
      const tx = new TransactionBlock();
      const amount = parseFloat(proposalForm.amount) || 0;
      
      tx.moveCall({
        target: `${PACKAGE_ID}::meme_dao::create_transfer_proposal`,
        typeArguments: [COIN_TYPE],
        arguments: [
          tx.object(selectedDao.id),
          tx.pure(Array.from(new TextEncoder().encode(proposalForm.title))),
          tx.pure(Array.from(new TextEncoder().encode(proposalForm.description))),
          tx.pure(proposalForm.targetAddress),
          tx.pure(Math.floor(amount * 1000000000)),
          tx.object('0x6')
        ]
      });

      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: { showEffects: true }
      });

      if (result.effects?.status?.status === 'success') {
        setProposalForm({ type: 'transfer', title: '', description: '', targetAddress: '', amount: '' });
        setTimeout(() => fetchProposals(selectedDao.id), 2000);
        setError('Proposal created successfully!');
      } else {
        setError('Failed to create proposal: ' + (result.effects?.status?.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating proposal:', err);
      if (err.message.includes('MoveAbort') && err.message.includes('2')) {
        setError('Not authorized to create proposals. You must be a DAO member.');
      } else {
        setError(`Failed to create proposal: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const voteOnProposal = async (proposalId, voteFor) => {
    if (!wallet.connected || !suiClient || !selectedDao) return;
    
    setLoading(true);
    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::meme_dao::vote_proposal`,
        typeArguments: [COIN_TYPE],
        arguments: [
          tx.object(selectedDao.id),
          tx.pure(proposalId),
          tx.pure(voteFor),
          tx.object('0x6')
        ]
      });

      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: { showEffects: true }
      });

      if (result.effects?.status?.status === 'success') {
        setTimeout(() => fetchProposals(selectedDao.id), 2000);
        setError('Vote recorded successfully!');
      }
    } catch (err) {
      console.error('Error voting:', err);
      setError(`Failed to vote: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (proposalId) => {
    if (!wallet.connected || !suiClient || !selectedDao) return;
    
    setLoading(true);
    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::meme_dao::execute_proposal`,
        typeArguments: [COIN_TYPE],
        arguments: [
          tx.object(selectedDao.id),
          tx.pure(proposalId),
          tx.object('0x6')
        ]
      });

      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: { showEffects: true }
      });

      if (result.effects?.status?.status === 'success') {
        setTimeout(() => fetchProposals(selectedDao.id), 2000);
        setError('Proposal executed successfully!');
      } else {
        setError('Failed to execute proposal: ' + (result.effects?.status?.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error executing proposal:', err);
      setError(`Failed to execute proposal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setProposalForm(prev => ({ ...prev, amount: value }));
    }
  };

  const handleThresholdChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setCreateDaoForm(prev => ({ ...prev, threshold: Math.max(1, value) }));
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-8">Meme DAO</h1>
          <ConnectButtonWrapper className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <header className="border-b border-purple-800 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Meme DAO</h1>
          <div className="flex items-center gap-4">
            <ConnectButtonWrapper />
            <span className="text-sm opacity-75">
              {wallet.account?.address.slice(0, 6)}...{wallet.account?.address.slice(-4)}
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className={`mb-4 p-4 rounded-lg ${error.includes('success') ? 'bg-green-600/20 border border-green-600' : 'bg-red-600/20 border border-red-600'}`}>
            {error}
            <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
          </div>
        )}

        <nav className="flex space-x-1 bg-black/30 p-1 rounded-lg mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'create', label: 'Create DAO', icon: Plus },
            { id: 'proposals', label: 'Proposals', icon: Vote }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your DAOs</h2>
              <button
                onClick={fetchUserDAOs}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {daos.map(dao => (
                <div 
                  key={dao.id}
                  className="bg-black/30 backdrop-blur-sm border border-purple-800 rounded-xl p-6 hover:bg-black/40 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedDao(dao);
                    fetchProposals(dao.id);
                  }}
                >
                  <h3 className="text-xl font-bold mb-2">{dao.name}</h3>
                  <p className="text-gray-300 mb-4">{dao.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Members:</span>
                      <span>{dao.members?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Threshold:</span>
                      <span>{dao.voting_threshold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Treasury:</span>
                      <span>{(dao.treasury_balance / 1000000000).toFixed(4)} SUI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Proposals:</span>
                      <span>{dao.proposal_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {daos.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No DAOs Found</h3>
                <p className="text-gray-400 mb-4">Create your first DAO to get started</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create DAO
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Create New DAO</h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-purple-800 rounded-xl p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">DAO Name</label>
                <input
                  type="text"
                  value={createDaoForm.name}
                  onChange={(e) => setCreateDaoForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Enter DAO name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={createDaoForm.description}
                  onChange={(e) => setCreateDaoForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none h-24"
                  placeholder="Describe your DAO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Initial Members</label>
                {createDaoForm.members.map((member, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={member}
                      onChange={(e) => {
                        const newMembers = [...createDaoForm.members];
                        newMembers[index] = e.target.value;
                        setCreateDaoForm(prev => ({ ...prev, members: newMembers }));
                      }}
                      className="flex-1 px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="0x..."
                    />
                    {createDaoForm.members.length > 1 && (
                      <button
                        onClick={() => {
                          const newMembers = createDaoForm.members.filter((_, i) => i !== index);
                          setCreateDaoForm(prev => ({ ...prev, members: newMembers }));
                        }}
                        className="text-red-400 hover:text-red-300 px-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setCreateDaoForm(prev => ({ ...prev, members: [...prev.members, ''] }))}
                  className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Voting Threshold</label>
                <input
                  type="number"
                  min="1"
                  value={createDaoForm.threshold}
                  onChange={handleThresholdChange}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                onClick={createDAO}
                disabled={loading || !createDaoForm.name || !createDaoForm.description}
                className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create DAO'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Proposals</h2>

            {!selectedDao ? (
              <div className="text-center py-12">
                <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No DAO Selected</h3>
                <p className="text-gray-400">Select a DAO from the overview to view proposals</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-black/30 backdrop-blur-sm border border-purple-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Create Proposal for {selectedDao.name}</h3>
                  
                  {selectedDao.members.includes(wallet.account.address) ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={proposalForm.title}
                          onChange={(e) => setProposalForm(prev => ({ ...prev, title: e.target.value }))}
                          className="px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                          placeholder="Proposal title"
                        />
                        <input
                          type="text"
                          value={proposalForm.targetAddress}
                          onChange={(e) => setProposalForm(prev => ({ ...prev, targetAddress: e.target.value }))}
                          className="px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                          placeholder="Target address"
                        />
                      </div>

                      <input
                        type="text"
                        value={proposalForm.amount}
                        onChange={handleAmountChange}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                        placeholder="Amount (SUI)"
                      />

                      <textarea
                        value={proposalForm.description}
                        onChange={(e) => setProposalForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none h-24"
                        placeholder="Proposal description"
                      />

                      <button
                        onClick={createProposal}
                        disabled={loading || !proposalForm.title || !proposalForm.targetAddress}
                        className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Creating...' : 'Create Proposal'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-red-400">You must be a member of this DAO to create proposals</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Active Proposals ({proposals.length})</h4>
                  {proposals.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No proposals found for this DAO</p>
                    </div>
                  ) : (
                    proposals.map(proposal => (
                      <div key={proposal.id} className="bg-black/30 backdrop-blur-sm border border-purple-800 rounded-xl p-6">
                        <h4 className="text-lg font-semibold mb-2">{proposal.title}</h4>
                        <p className="text-gray-300 mb-4">{proposal.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <span className="text-gray-400">Proposer:</span>
                            <p className="font-mono text-xs">
                              {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Amount:</span>
                            <p>{(proposal.amount / 1000000000).toFixed(4)} SUI</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Type:</span>
                            <p>{proposal.proposal_type === 0 ? 'Transfer' : 'Other'}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Status:</span>
                            <p className={`font-semibold ${proposal.executed ? 'text-green-400' : 'text-yellow-400'}`}>
                              {proposal.executed ? 'Executed' : 'Pending'}
                            </p>
                          </div>
                        </div>

                        {proposal.target_address && (
                          <div className="mb-4 text-sm">
                            <span className="text-gray-400">Target Address:</span>
                            <p className="font-mono text-xs">{proposal.target_address}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span>For: {proposal.votes_for}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span>Against: {proposal.votes_against}</span>
                            </div>
                          </div>
                          
                          {!proposal.executed && selectedDao.members.includes(wallet.account.address) && (
                            <div className="flex gap-2">
                            <button
                              onClick={() => voteOnProposal(proposal.id, true)}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              Vote For
                            </button>
                            <button
                              onClick={() => voteOnProposal(proposal.id, false)}
                              disabled={loading}
                              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              Vote Against
                            </button>
                            {proposal.votes_for >= selectedDao.voting_threshold && (
                              <button
                                onClick={() => executeProposal(proposal.id)}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                Execute
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
};

export default MemeDAOInterface;